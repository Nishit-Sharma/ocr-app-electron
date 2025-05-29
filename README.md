# Accounting Document Organizer

A powerful desktop application that automatically categorizes accounting documents using OCR (Optical Character Recognition) and AI-powered classification. Simply upload your documents and let the app organize them into appropriate categories like invoices, receipts, tax documents, and more.

## ✨ Features

### 🤖 **Intelligent Document Processing**
- **Automatic OCR**: Extract text from images (JPEG, PNG, GIF, BMP, WebP) and PDF files
- **AI Classification**: Automatically categorize documents into predefined accounting categories
- **Confidence Scoring**: See how confident the AI is about each categorization
- **Batch Processing**: Process multiple documents simultaneously with parallel processing
- **Error Handling**: Robust processing with clear error messages and retry mechanisms

### 📁 **Smart Organization**
- **Category-based Sorting**: Documents are automatically sorted into folders by type
- **ZIP Export**: Download organized documents in a structured archive
- **Metadata Tracking**: Each document includes processing information and confidence scores
- **Original File Preservation**: Your original files remain unchanged

### 🎨 **User-Friendly Interface**
- **Drag & Drop**: Easy file upload with visual feedback
- **Real-time Progress**: Live updates showing processing status and queue
- **Responsive Design**: Clean, modern interface that works on different screen sizes
- **Dark/Light Mode**: Automatic theme detection
- **Toast Notifications**: Clear feedback for all operations

## 📋 Document Categories

The app automatically recognizes and categorizes the following document types:

| Category | Examples | Identification Keywords |
|----------|----------|------------------------|
| **Tax Documents** | W-2, 1099, 1040, Tax Returns | Form numbers, IRS, tax terminology |
| **Invoices** | Bills, Payment Requests | Invoice numbers, due dates, amounts due |
| **Receipts** | Purchase Receipts, Payment Confirmations | Receipt numbers, payment confirmations |
| **Bank Statements** | Monthly Statements, Account Summaries | Account balances, transaction history |
| **Payroll** | Pay Stubs, Earnings Statements | Gross/net pay, withholdings, YTD |
| **Expense Reports** | Travel Expenses, Reimbursements | Expense categories, mileage, per diem |

Documents that don't match any category are placed in "Other Documents" for manual review.

## 🚀 Getting Started

### Prerequisites

- **Node.js** 16 or higher
- **npm** or **yarn** package manager
- **Operating System**: Windows, macOS, or Linux

### Installation

1. **Download or Clone the Repository**
   ```bash
   git clone <repository-url>
   cd ocr-app-electron
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run in Development Mode**
```bash
npm run dev
   ```
   The app will be available at `http://localhost:3000`

4. **Build for Production**
   ```bash
   npm run build
   npm run electron
   ```

5. **Create Distributable Package**
   ```bash
   npm run package
   ```
   This creates a distributable application in the `dist` folder.

## 📖 How to Use

### 1. Upload Documents
- **Drag and drop** files directly onto the upload area, or
- **Click** the upload area to select files from your computer
- Supported formats: Images (JPEG, PNG, GIF, BMP, WebP) and PDF files
- Maximum file size: 50MB per file

### 2. Review File List
- View all uploaded files in the file list
- Check file types and sizes
- Remove unwanted files using the delete button
- Files are processed in the order they appear

### 3. Process Documents
- Click **"Process Documents"** to start OCR and categorization
- Watch real-time progress with live status updates
- See which files are currently being processed (up to 10 simultaneously)
- Processing automatically handles errors and continues with remaining files

### 4. Review Results
- View categorization results with confidence scores
- Files are organized by category with color-coded labels
- Check for any files that had processing errors
- Results maintain the original file order

### 5. Download Organized Files
- Click **"Download Organized ZIP"** to get your sorted documents
- Files are organized into folders by category
- Each document includes metadata about the processing
- Original filenames and formats are preserved

### 6. Reset and Start Over
- Use the **"Reset"** button to clear all files and start fresh
- All uploaded files and results are cleared
- Memory is properly cleaned up

## 🛠️ Technologies Used

### **Frontend Framework**
- **Next.js 15** - React framework for web applications
- **React 19** - User interface library
- **Tailwind CSS** - Utility-first CSS framework
- **React Dropzone** - File upload component

### **OCR and Document Processing**
- **Tesseract.js** - JavaScript OCR library for text extraction from images
- **PDF.js** - Mozilla's PDF parsing library for text extraction from PDFs
- **Pattern Matching** - Custom AI logic for document categorization

### **Desktop Application**
- **Electron** - Cross-platform desktop app framework
- **Node.js** - JavaScript runtime for server-side operations

### **File Management**
- **JSZip** - JavaScript library for creating ZIP archives
- **File Saver** - Client-side file downloading

### **Development Tools**
- **ESLint** - Code linting and quality assurance
- **PostCSS** - CSS processing tool
- **Turbopack** - Fast build system

## ⚙️ Configuration

### File Size and Type Limits
- **Maximum file size**: 50MB per file
- **Supported image formats**: JPEG, JPG, PNG, GIF, BMP, WebP
- **Supported document formats**: PDF
- **Concurrent processing**: Up to 10 files simultaneously
- **Maximum filename length**: 255 characters

### Processing Performance
- **Parallel processing**: Multiple files processed simultaneously
- **Queue management**: Automatic load balancing for optimal performance
- **Memory management**: Automatic cleanup to prevent memory leaks
- **Progress tracking**: Real-time updates on processing status

## 🔧 Troubleshooting

### Common Issues

**📄 PDF Processing Problems**
- Ensure PDFs are not password-protected
- Scanned PDFs work better than image-based PDFs
- Large PDFs may take longer to process

**🖼️ Image Quality Issues**
- Use high-resolution images for better OCR accuracy
- Ensure text is clearly visible and not blurry
- Avoid images with complex backgrounds

**💾 Performance Issues**
- Close other applications when processing many large files
- Reduce concurrent processing limit if experiencing memory issues
- Process files in smaller batches for very large documents

**🌐 Network Issues**
- Ensure internet connection for initial Tesseract.js worker download
- OCR processing happens locally after initial setup

### Error Messages
- **"File too large"**: Reduce file size or split large documents
- **"No text found"**: Check if document contains readable text
- **"Processing failed"**: Try with a different file format or quality

## 🤝 Contributing

We welcome contributions! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For help and support:

- **Issues**: Report bugs or request features via GitHub Issues
- **Documentation**: Check this README for usage instructions
- **Community**: Join discussions in the project repository

When reporting issues, please include:
- Operating system and version
- Node.js version
- Description of the problem
- Steps to reproduce
- Sample files (if applicable and safe to share)

---

**Made with ❤️ for better document organization**
