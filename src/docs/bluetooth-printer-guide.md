# Bluetooth Thermal Printer Guide

## Overview

The Sales & Billing System now supports direct printing to 2-inch (58mm) Bluetooth thermal printers. This allows you to print invoices wirelessly without needing to use the browser's print dialog.

## Features

- ✅ Direct Bluetooth connection to thermal printers
- ✅ ESC/POS command support for wide compatibility
- ✅ Optimized layout for 58mm (2-inch) thermal paper
- ✅ Test print functionality
- ✅ Connection status monitoring
- ✅ Support for multiple printers

## Browser Compatibility

Web Bluetooth API is supported in:

- ✅ **Chrome** (Desktop, Android)
- ✅ **Edge** (Desktop, Android)
- ✅ **Opera** (Desktop, Android)
- ❌ **Safari** (iOS/macOS) - Not supported
- ❌ **Firefox** - Not supported by default

**Note:** For best results, use Chrome on desktop or Android devices.

## Compatible Printers

The system works with:

- 58mm (2-inch) Bluetooth thermal printers
- ESC/POS compatible printers
- Most portable receipt printers with Bluetooth
- Common brands: Xprinter, Epson TM series, GOOJPRT, etc.

## How to Connect Your Printer

### Step 1: Prepare Your Printer

1. Turn on your Bluetooth thermal printer
2. Ensure the printer has paper loaded
3. Put the printer in pairing mode (refer to your printer's manual)
   - Most printers enter pairing mode automatically when powered on
   - Some may require holding a specific button

### Step 2: Connect via Settings

1. Navigate to **Settings** → **Printer** tab
2. Click the **"Connect Printer"** button
3. A browser dialog will appear showing available Bluetooth devices
4. Select your printer from the list
5. Wait for the connection to establish
6. You'll see a success message with your printer name

### Step 3: Test the Connection

1. Once connected, click the **"Test Print"** button
2. Your printer should print a test receipt
3. If successful, you're ready to print invoices!

## Printing Invoices

### From Bill Preview

1. After creating a bill, click the **"Print"** button
2. In the preview screen, click **"Bluetooth Printer"**
3. Ensure your printer is connected (green status indicator)
4. Click **"Print Invoice"**
5. The invoice will be sent to your thermal printer

### Quick Print from Create Bill

1. Create a new bill with items
2. Click **"Save & Print"**
3. The bill preview opens automatically
4. Click **"Bluetooth Printer"** and then **"Print Invoice"**

## Invoice Format

The thermal printer uses an optimized layout:

```
================================
     YOUR BUSINESS NAME
--------------------------------
Address line 1
Address line 2
Ph: Phone Number
Email: your@email.com
GST: GST Number
================================
Bill No:              BL-0001
Date:          14 Nov, 2024 2:30PM
Customer:         John Doe
Seller:           Jane Smith
Payment:              Cash
--------------------------------
ITEM            QTY   RATE  TOTAL
--------------------------------
Product Name
                  2   50.00 100.00
Another Item
                  1  150.00 150.00
================================
TOTAL:           Rs.250.00
--------------------------------
Note: Thank you for your purchase
================================
  Thank you for your business!


[Paper Cut]
```

## Troubleshooting

### Printer Not Found

**Problem:** Printer doesn't appear in the device list

**Solutions:**
- Ensure the printer is powered on
- Check if the printer is in pairing mode
- Move the printer closer to your device
- Try restarting the printer
- Check if the printer is already paired with another device

### Connection Failed

**Problem:** "Failed to connect to printer" error

**Solutions:**
- Unpair the printer from your device's Bluetooth settings first
- Restart both the printer and browser
- Clear browser cache and try again
- Try using Chrome browser if using a different browser

### Print Command Sent but Nothing Prints

**Problem:** No error shown but printer doesn't print

**Solutions:**
- Check if the printer has paper
- Ensure the paper is loaded correctly
- Try the "Test Print" function first
- Restart the printer and reconnect
- Check printer battery if it's portable

### Partial or Garbled Print

**Problem:** Print output is incomplete or has strange characters

**Solutions:**
- This usually indicates the printer uses a different command set
- Try reconnecting the printer
- Contact support with your printer model

### Browser Not Supported Error

**Problem:** "Web Bluetooth is not supported" message

**Solutions:**
- Use Chrome, Edge, or Opera browser
- Update your browser to the latest version
- Enable Web Bluetooth in browser flags (chrome://flags)
- Switch to a supported device (not iOS)

## Technical Details

### ESC/POS Commands Used

The system uses standard ESC/POS commands:

- **ESC @** - Initialize printer
- **ESC a** - Set text alignment
- **GS !** - Set text size
- **ESC E** - Set bold mode
- **ESC d** - Feed lines
- **GS V** - Cut paper

### Data Transmission

- Data is sent in 20-byte chunks for maximum compatibility
- Small delays between chunks prevent buffer overflow
- Automatic retry on connection loss

### Paper Width

- Optimized for 58mm (2-inch) paper
- 32 characters per line
- Supports text wrapping for long item names

## Best Practices

1. **Keep Printer Connected:** Once connected, the printer remains paired. You only need to connect once per session.

2. **Test Before Printing Bills:** Always run a test print after connecting to ensure the printer is working correctly.

3. **Check Paper Regularly:** Thermal printers can't detect low paper. Always ensure you have enough paper before printing.

4. **Battery Management:** If using a portable printer, keep it charged for consistent performance.

5. **Browser Print as Backup:** You can always use the "Browser Print" button as a fallback if Bluetooth printing fails.

## Security & Privacy

- Bluetooth connections are point-to-point and encrypted
- No data is sent to external servers during printing
- Only the current invoice data is transmitted to the printer
- Connection is terminated after each print job (optional reconnection)

## FAQ

**Q: Can I connect multiple printers?**
A: You can only connect to one printer at a time. Disconnect the current printer before connecting a new one.

**Q: Does the printer stay connected?**
A: Yes, the printer remains connected until you disconnect it or close the browser.

**Q: Will this work on my phone?**
A: Yes, if you're using Chrome or Edge on an Android device. iOS is not supported.

**Q: Can I print multiple copies?**
A: Currently, you need to click "Print Invoice" multiple times to print multiple copies.

**Q: What if my printer uses a different paper size?**
A: The system is optimized for 58mm paper. Other sizes may result in formatting issues.

**Q: Is an internet connection required?**
A: No, Bluetooth printing works completely offline once the app is loaded.

## Support

For issues or questions about Bluetooth printing:

1. Check this troubleshooting guide first
2. Verify your printer model is ESC/POS compatible
3. Test with the built-in test print function
4. Try the browser print option as an alternative

## Future Enhancements

Planned features:
- Support for 80mm (3-inch) thermal printers
- Multiple copy printing
- Custom print templates
- Printer memory/favorites
- QR code printing on receipts
