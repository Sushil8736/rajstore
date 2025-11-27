// Bluetooth Thermal Printer Utility for 58mm (2-inch) printers
// Uses ESC/POS commands for thermal printing

export interface PrinterDevice {
  device: BluetoothDevice;
  characteristic: BluetoothRemoteGATTCharacteristic | null;
}

// ESC/POS Commands
const ESC = 0x1b;
const GS = 0x1d;

class BluetoothPrinterService {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private connected: boolean = false;

  // Check if Web Bluetooth is supported
  isSupported(): boolean {
    return 'bluetooth' in navigator;
  }

  // Scan and connect to a Bluetooth printer
  async connect(): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser');
    }

    try {
      // Request Bluetooth device
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Common printer service
        ],
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Some printers use this
        ],
      });

      if (!this.device.gatt) {
        throw new Error('GATT not available');
      }

      // Connect to GATT server
      const server = await this.device.gatt.connect();
      
      // Get the primary service
      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      
      // Get the characteristic for writing
      this.characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

      this.connected = true;
      
      // Handle disconnection
      this.device.addEventListener('gattserverdisconnected', () => {
        this.connected = false;
        this.characteristic = null;
      });

      return true;
    } catch (error) {
      console.error('Bluetooth connection error:', error);
      
      // Try alternative connection method for different printer models
      try {
        if (!this.device) {
          this.device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [
              '000018f0-0000-1000-8000-00805f9b34fb',
              '49535343-fe7d-4ae5-8fa9-9fafd205e455',
            ],
          });
        }

        if (this.device.gatt) {
          const server = await this.device.gatt.connect();
          const services = await server.getPrimaryServices();
          
          // Try to find a writable characteristic
          for (const service of services) {
            const characteristics = await service.getCharacteristics();
            for (const char of characteristics) {
              if (char.properties.write || char.properties.writeWithoutResponse) {
                this.characteristic = char;
                this.connected = true;
                return true;
              }
            }
          }
        }
      } catch (altError) {
        console.error('Alternative connection failed:', altError);
        throw new Error('Failed to connect to printer. Please ensure the printer is on and in pairing mode.');
      }
      
      throw error;
    }
  }

  // Disconnect from printer
  async disconnect(): Promise<void> {
    if (this.device && this.device.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.connected = false;
    this.characteristic = null;
    this.device = null;
  }

  // Check if connected
  isConnected(): boolean {
    return this.connected && this.characteristic !== null;
  }

  // Get connected device name
  getDeviceName(): string | null {
    return this.device?.name || null;
  }

  // Send raw data to printer
  private async sendData(data: Uint8Array): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Printer not connected');
    }

    // Split data into chunks (some printers have MTU limitations)
    const chunkSize = 20; // Conservative chunk size for compatibility
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await this.characteristic.writeValue(chunk);
      // Small delay to prevent buffer overflow
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  // ESC/POS command builders
  private buildCommand(...bytes: number[]): Uint8Array {
    return new Uint8Array(bytes);
  }

  private textToBytes(text: string): Uint8Array {
    const encoder = new TextEncoder();
    return encoder.encode(text);
  }

  // Initialize printer
  private initPrinter(): Uint8Array {
    return this.buildCommand(ESC, 0x40); // ESC @ - Initialize printer
  }

  // Set text alignment (0=left, 1=center, 2=right)
  private setAlignment(align: 0 | 1 | 2): Uint8Array {
    return this.buildCommand(ESC, 0x61, align);
  }

  // Set text size (1-8 for width, 1-8 for height)
  private setTextSize(width: number, height: number): Uint8Array {
    const size = ((width - 1) << 4) | (height - 1);
    return this.buildCommand(GS, 0x21, size);
  }

  // Set text bold
  private setBold(bold: boolean): Uint8Array {
    return this.buildCommand(ESC, 0x45, bold ? 1 : 0);
  }

  // Feed paper
  private feedLines(lines: number): Uint8Array {
    return this.buildCommand(ESC, 0x64, lines);
  }

  // Cut paper
  private cutPaper(): Uint8Array {
    return this.buildCommand(GS, 0x56, 0x00);
  }

  // Line feed
  private lineFeed(): Uint8Array {
    return this.textToBytes('\n');
  }

  // Print separator line
  private separator(char: string = '-'): Uint8Array {
    return this.textToBytes(char.repeat(32) + '\n');
  }

  // Format text to fit 32 characters (58mm paper)
  private formatLine(left: string, right: string, totalWidth: number = 32): string {
    const leftTrimmed = left.substring(0, totalWidth - right.length - 1);
    const spaces = totalWidth - leftTrimmed.length - right.length;
    return leftTrimmed + ' '.repeat(Math.max(0, spaces)) + right;
  }

  // Combine multiple Uint8Arrays
  private combineArrays(...arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }
    return result;
  }

  // Main print function for bills
  async printBill(billData: {
    businessName: string;
    address?: string;
    phone?: string;
    email?: string;
    gst?: string;
    billNumber: string;
    date: string;
    customerName?: string;
    sellerName?: string;
    paymentMode?: string;
    items: Array<{
      name: string;
      quantity: number;
      rate: number;
      total: number;
      discountType?: 'fixed' | 'percentage';
      discountValue?: number;
      discountAmount?: number;
    }>;
    subtotal?: number;
    discountType?: 'fixed' | 'percentage';
    discountValue?: number;
    discountAmount?: number;
    grandTotal: number;
    notes?: string;
    termsAndConditions?: string;
  }): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Printer not connected');
    }

    try {
      const commands: Uint8Array[] = [];

      // Initialize printer
      commands.push(this.initPrinter());

      // Print business header (centered, bold, larger)
      commands.push(this.setAlignment(1)); // Center
      commands.push(this.setBold(true));
      commands.push(this.setTextSize(2, 2));
      commands.push(this.textToBytes(billData.businessName.toUpperCase()));
      commands.push(this.lineFeed());
      commands.push(this.setTextSize(1, 1));
      commands.push(this.setBold(false));

      // Business details (centered, small)
      if (billData.address) {
        commands.push(this.textToBytes(billData.address));
        commands.push(this.lineFeed());
      }
      if (billData.phone) {
        commands.push(this.textToBytes(`Ph: ${billData.phone}`));
        commands.push(this.lineFeed());
      }
      if (billData.email) {
        commands.push(this.textToBytes(billData.email));
        commands.push(this.lineFeed());
      }
      if (billData.gst) {
        commands.push(this.textToBytes(`GST: ${billData.gst}`));
        commands.push(this.lineFeed());
      }

      // Separator
      commands.push(this.separator('='));

      // Bill details (left aligned)
      commands.push(this.setAlignment(0)); // Left align
      commands.push(this.textToBytes(this.formatLine('Bill No:', billData.billNumber)));
      commands.push(this.lineFeed());
      commands.push(this.textToBytes(this.formatLine('Date:', billData.date)));
      commands.push(this.lineFeed());

      if (billData.customerName) {
        commands.push(this.textToBytes(this.formatLine('Customer:', billData.customerName)));
        commands.push(this.lineFeed());
      }

      if (billData.sellerName) {
        commands.push(this.textToBytes(this.formatLine('Seller:', billData.sellerName)));
        commands.push(this.lineFeed());
      }

      if (billData.paymentMode) {
        commands.push(this.textToBytes(this.formatLine('Payment:', billData.paymentMode)));
        commands.push(this.lineFeed());
      }

      // Items separator
      commands.push(this.separator('-'));

      // Items header
      commands.push(this.setBold(true));
      commands.push(this.textToBytes('Item          Qty   Rate  Amount'));
      commands.push(this.lineFeed());
      commands.push(this.separator('-'));
      commands.push(this.setBold(false));

      // Print items
      for (const item of billData.items) {
        const subtotal = item.quantity * item.rate;
        const hasDiscount = item.discountValue && item.discountValue > 0;

        const name = item.name.length > 12 ? item.name.substring(0, 12) + '…' : item.name.padEnd(12);
        const qty = item.quantity.toString().padStart(3);
        const rate = item.rate.toFixed(2).padStart(7);
        const amount = (hasDiscount ? subtotal : item.total).toFixed(2).padStart(8);
        const itemLine = `${name}${qty}${rate}${amount}`;
        commands.push(this.textToBytes(itemLine));
        commands.push(this.lineFeed());

        // Print item discount if applicable
        if (hasDiscount) {
          const discountLabel = item.discountType === 'percentage'
            ? `Discount:${item.discountValue}%`
            : `Discount:Rs${item.discountValue}`;
          const discountInfo = `  ${discountLabel} -Rs${(item.discountAmount || 0).toFixed(2)}`;
          commands.push(this.textToBytes(discountInfo));
          commands.push(this.lineFeed());

          // After discount amount
          const afterDiscountLine = this.formatLine('  After Discount:', `Rs.${item.total.toFixed(2)}`);
          commands.push(this.setBold(true));
          commands.push(this.textToBytes(afterDiscountLine));
          commands.push(this.lineFeed());
          commands.push(this.setBold(false));
        }
      }

      // Separator before totals
      commands.push(this.separator('-'));

      // Subtotal
      const subtotal = billData.subtotal || billData.grandTotal;
      commands.push(this.textToBytes(this.formatLine('Subtotal:', `Rs.${subtotal.toFixed(2)}`)));
      commands.push(this.lineFeed());

      // Discount (if applicable)
      if (billData.discountValue && billData.discountValue > 0 && billData.discountAmount) {
        const discountLabel = billData.discountType === 'percentage' 
          ? `Discount (${billData.discountValue}%):`
          : `Discount (Rs.${billData.discountValue}):`;
        commands.push(this.textToBytes(this.formatLine(discountLabel, `- Rs.${billData.discountAmount.toFixed(2)}`)));
        commands.push(this.lineFeed());
      }

      // Total separator
      commands.push(this.separator('='));

      // Grand total (bold, larger)
      commands.push(this.setBold(true));
      commands.push(this.setTextSize(2, 2));
      commands.push(this.setAlignment(2)); // Right align
      commands.push(this.textToBytes(`Total: Rs.${billData.grandTotal.toFixed(2)}`));
      commands.push(this.lineFeed());
      commands.push(this.setTextSize(1, 1));
      commands.push(this.setBold(false));
      commands.push(this.setAlignment(0)); // Left align

      // Notes
      if (billData.notes) {
        commands.push(this.separator('-'));
        commands.push(this.textToBytes(`Note: ${billData.notes}`));
        commands.push(this.lineFeed());
      }

      // Terms and Conditions
      if (billData.termsAndConditions) {
        commands.push(this.separator('-'));
        commands.push(this.setAlignment(1)); // Center
        // Split terms and conditions by newlines for better formatting
        const termsLines = billData.termsAndConditions.split('\n');
        for (const line of termsLines) {
          if (line.trim()) {
            commands.push(this.textToBytes(line.trim()));
            commands.push(this.lineFeed());
          }
        }
      }

      // Footer
      commands.push(this.separator('='));
      commands.push(this.setAlignment(1)); // Center
      commands.push(this.textToBytes('Thank you for your business!'));
      commands.push(this.lineFeed());
      commands.push(this.lineFeed());

      // Feed and cut
      commands.push(this.feedLines(3));
      commands.push(this.cutPaper());

      // Combine all commands
      const finalData = this.combineArrays(...commands);

      // Send to printer
      await this.sendData(finalData);

      console.log('Bill printed successfully');
    } catch (error) {
      console.error('Print error:', error);
      throw new Error('Failed to print bill. Please check printer connection.');
    }
  }

  // Test print function
  async testPrint(): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Printer not connected');
    }

    const commands: Uint8Array[] = [];
    
    commands.push(this.initPrinter());
    commands.push(this.setAlignment(1));
    commands.push(this.setBold(true));
    commands.push(this.setTextSize(2, 2));
    commands.push(this.textToBytes('TEST PRINT'));
    commands.push(this.lineFeed());
    commands.push(this.setTextSize(1, 1));
    commands.push(this.setBold(false));
    commands.push(this.separator('-'));
    commands.push(this.textToBytes('Printer is working correctly!'));
    commands.push(this.lineFeed());
    commands.push(this.feedLines(3));
    commands.push(this.cutPaper());

    const finalData = this.combineArrays(...commands);
    await this.sendData(finalData);
  }
}

// Export singleton instance
export const bluetoothPrinter = new BluetoothPrinterService();