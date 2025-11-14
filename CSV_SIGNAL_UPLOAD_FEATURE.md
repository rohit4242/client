# CSV Bulk Signal Upload Feature

## Overview
This feature allows administrators to bulk upload trading signals via CSV files for selected users in the admin panel.

## Implementation Complete ✅

### Files Created
1. **`public/templates/signals-upload-example.csv`** - Example CSV template for users to download
2. **`public/templates/signals-upload-test-mixed.csv`** - Test file with valid and invalid rows
3. **`src/app/(admin)/signal-bot/_components/dialogs/upload-signals-csv-dialog.tsx`** - Main upload dialog component
4. **`src/app/api/admin/users/[userId]/signals/bulk/route.ts`** - Bulk upload API endpoint

### Files Modified
1. **`src/app/(admin)/signal-bot/_components/user-signals-manager.tsx`** - Added "Upload CSV" button

### Dependencies Added
- `papaparse` - CSV parsing library
- `@types/papaparse` - TypeScript types for papaparse

## How It Works

### User Flow
1. Admin selects a customer user from the user list
2. Admin navigates to the "Signal Bot" tab in the admin panel
3. Admin sees the "User Signals" section with two buttons:
   - **Upload CSV** (outlined button with Upload icon)
   - **Add Signal** (primary button with Plus icon)
4. Admin clicks "Upload CSV" button
5. Dialog opens with:
   - File upload input (accepts only .csv files)
   - "Download Template" button to get example CSV format
6. Admin downloads template or uses existing CSV file
7. Admin selects CSV file
8. System automatically parses and validates CSV:
   - Checks for required fields (botName, action, symbol)
   - Validates bot name exists for selected user
   - Validates action is one of: ENTER_LONG, EXIT_LONG, ENTER_SHORT, EXIT_SHORT
   - Validates price is positive number (if provided)
9. Preview table displays all rows with:
   - Row number
   - Validation status icon (green check or red X)
   - All data fields (botName, action, symbol, price, message)
   - Inline error messages for invalid rows
10. Stats summary shows: Total, Valid (green), Invalid (red) counts
11. Admin clicks "Upload X Signals" button (only valid signals)
12. System creates signals for all valid rows, skips invalid ones
13. Results displayed showing:
    - Number of signals created successfully
    - Number of signals failed
    - Specific error messages for failed rows
14. Signals list automatically refreshes to show new signals

### CSV Format

**Required Headers:**
```csv
botName,action,symbol,price,message
```

**Field Specifications:**
- **botName** (required): Name of the signal bot (case-insensitive match)
- **action** (required): One of ENTER_LONG, EXIT_LONG, ENTER_SHORT, EXIT_SHORT
- **symbol** (required): Trading pair symbol (e.g., BTCUSDT)
- **price** (optional): Signal price (must be positive number if provided)
- **message** (optional): Custom signal message

**Example CSV:**
```csv
botName,action,symbol,price,message
My Trading Bot,ENTER_LONG,BTCUSDT,45000,Bitcoin long entry signal
Scalping Bot,EXIT_LONG,ETHUSDT,2500,Taking profits on ETH
Swing Trader,ENTER_SHORT,BNBUSDT,350,BNB short position
Day Trader,EXIT_SHORT,ADAUSDT,,Exit ADA short position
```

### Validation Rules

1. **Bot Name Validation:**
   - Cannot be empty
   - Must match an existing bot name for the selected user (case-insensitive)
   - Error message: "Bot name is required" or "Bot 'X' not found"

2. **Action Validation:**
   - Cannot be empty
   - Must be exactly: ENTER_LONG, EXIT_LONG, ENTER_SHORT, or EXIT_SHORT
   - Error message: "Action is required" or "Invalid action 'X'. Must be one of: ..."

3. **Symbol Validation:**
   - Cannot be empty
   - Automatically converted to uppercase
   - Error message: "Symbol is required"

4. **Price Validation:**
   - Optional field
   - If provided, must be a positive number
   - Empty values are allowed
   - Error message: "Price must be a positive number"

5. **Message Validation:**
   - Optional field
   - No restrictions

### API Endpoint

**POST** `/api/admin/users/[userId]/signals/bulk`

**Request Body:**
```json
{
  "signals": [
    {
      "botId": "uuid-string",
      "action": "ENTER_LONG",
      "symbol": "BTCUSDT",
      "price": 45000,
      "message": "Optional message"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "created": 5,
  "failed": 2,
  "errors": [
    {
      "row": 3,
      "error": "Bot not found or does not belong to this user"
    },
    {
      "row": 5,
      "error": "Invalid action"
    }
  ]
}
```

## Features Implemented

### 1. ✅ CSV Template Download
- Pre-made example CSV file
- Download button in upload dialog
- Shows proper format and example data

### 2. ✅ File Upload & Parsing
- File input accepts only .csv files
- Uses papaparse library for robust CSV parsing
- Handles errors gracefully with user feedback

### 3. ✅ Real-time Validation
- Validates each row immediately after parsing
- Bot name lookup using case-insensitive matching
- Comprehensive validation for all fields

### 4. ✅ Visual Preview Table
- Shows all parsed rows in scrollable table
- Color-coded status indicators:
  - Green checkmark for valid rows
  - Red X for invalid rows
- Inline error messages per row
- Color-coded action badges matching signal types

### 5. ✅ Stats Summary
- Total rows count
- Valid rows count (green border)
- Invalid rows count (red border)

### 6. ✅ Selective Upload
- Only valid rows are uploaded
- Invalid rows are skipped automatically
- No need to fix CSV and re-upload

### 7. ✅ Detailed Results
- Shows count of created signals
- Shows count of failed signals
- Lists specific errors for failed rows
- Results persist in dialog for review

### 8. ✅ Integration
- Seamlessly integrated into UserSignalsManager
- Upload CSV button next to Add Signal button
- Auto-refresh signals list after upload
- Toast notifications for user feedback

### 9. ✅ Error Handling
- Graceful handling of parsing errors
- Detailed validation error messages
- API error handling with user-friendly messages
- Transaction safety (failed rows don't affect valid ones)

### 10. ✅ User Experience
- Dialog can be reset to start over
- Auto-close after successful upload (all valid)
- Disabled state during upload
- Loading indicators during processing

## Testing Scenarios

### Test Case 1: All Valid Signals
**CSV:**
```csv
botName,action,symbol,price,message
My Trading Bot,ENTER_LONG,BTCUSDT,45000,Test signal 1
My Trading Bot,EXIT_LONG,ETHUSDT,2500,Test signal 2
```
**Expected:** All 2 signals created successfully

### Test Case 2: Mixed Valid/Invalid
**CSV:**
```csv
botName,action,symbol,price,message
My Trading Bot,ENTER_LONG,BTCUSDT,45000,Valid signal
,ENTER_LONG,ETHUSDT,2500,Missing bot name
Invalid Bot,ENTER_LONG,BNBUSDT,350,Bot not found
My Trading Bot,WRONG_ACTION,ADAUSDT,1.5,Invalid action
My Trading Bot,EXIT_SHORT,SOLUSDT,-50,Negative price
```
**Expected:** 1 created, 4 failed with specific errors

### Test Case 3: All Invalid
**CSV:**
```csv
botName,action,symbol,price,message
,,,
Wrong Bot,INVALID,,-100,
```
**Expected:** 0 created, 2 failed, button disabled

### Test Case 4: Optional Fields
**CSV:**
```csv
botName,action,symbol,price,message
My Trading Bot,ENTER_LONG,BTCUSDT,,
My Trading Bot,EXIT_LONG,ETHUSDT,2500,
```
**Expected:** Both created successfully (price and message are optional)

## Security Features

1. **Admin-Only Access:** All endpoints require admin authentication
2. **User Isolation:** Signals can only be created for bots owned by the specified user
3. **Bot Verification:** System verifies bot belongs to user's portfolio before creating signal
4. **Input Validation:** Comprehensive validation using Zod schemas
5. **Error Isolation:** Failed signals don't affect successful ones (non-transactional by design)

## UI Components Used

- Dialog (shadcn/ui)
- Button (shadcn/ui)
- Input (shadcn/ui)
- Table (shadcn/ui)
- Badge (shadcn/ui)
- Label (shadcn/ui)
- Icons from lucide-react (Upload, Download, CheckCircle2, XCircle, AlertCircle, Plus)

## Code Quality

- ✅ No linter errors
- ✅ TypeScript strict mode compliant
- ✅ Proper error handling throughout
- ✅ Consistent code style with existing codebase
- ✅ Comprehensive validation logic
- ✅ User-friendly error messages
- ✅ Responsive design

## Future Enhancements (Optional)

1. Add column mapping feature for different CSV formats
2. Support for Excel files (.xlsx)
3. Batch size limits for very large files
4. Progress bar for large uploads
5. Export current signals to CSV
6. Duplicate signal detection
7. Scheduled signal uploads
8. CSV validation before file upload (client-side pre-check)

## Conclusion

The CSV bulk signal upload feature is fully implemented and ready for use. It provides a robust, user-friendly way for administrators to manage multiple signals efficiently through CSV file uploads.

