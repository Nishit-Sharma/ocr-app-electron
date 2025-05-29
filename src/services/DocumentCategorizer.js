// Document categorization service
export class DocumentCategorizer {
  static categoryPatterns = {
    'Tax Documents': [
      { pattern: /\bw-?[2-9]\b|\bform\s+w-?[2-9]\b/i, weight: 10 },
      { pattern: /\b1099\b|\b1040\b|\b1098\b|\bschedule [a-e]\b/i, weight: 10 },
      { pattern: /\btax return\b|\btax form\b|\btax statement\b|\btax document\b/i, weight: 8 },
      { pattern: /\birs\b|\btax id\b|\btaxpayer\b|\btax year\b|\btaxable\b/i, weight: 6 },
      { pattern: /\bein\b|\bssn\b|\btax identification\b/i, weight: 6 },
      { pattern: /\btax\b/, weight: 3 }
    ],
    'Invoices': [
      { pattern: /\binvoice\s+number\b|\binvoice\s+#\b|\binvoice\s+no\b|\bdue date\b/i, weight: 8 },
      { pattern: /\bpayment\s+due\b|\bbalance\s+due\b|\binvoice\s+total\b|\bamount\s+due\b/i, weight: 7 },
      { pattern: /\binvoice\b/i, weight: 5 },
      { pattern: /\bbill\b|\bbilling\b/i, weight: 4 }
    ],
    'Receipts': [
      { pattern: /\breceipt\s+number\b|\breceipt\s+#\b|\breceipt\s+no\b/i, weight: 8 },
      { pattern: /\bpayment\s+received\b|\btransaction\s+complete\b|\bpayment\s+confirmation\b/i, weight: 7 },
      { pattern: /\breceipt\b|\bpaid\b/i, weight: 5 },
      { pattern: /\bthanks?\s+for\s+your\s+purchase\b|\bpurchase\s+confirmation\b/i, weight: 6 }
    ],
    'Bank Statements': [
      { pattern: /\baccount\s+statement\b|\bbank\s+statement\b|\bmonthly\s+statement\b/i, weight: 9 },
      { pattern: /\bbeginning\s+balance\b|\bending\s+balance\b|\btransaction\s+history\b/i, weight: 8 },
      { pattern: /\bstatement\s+period\b|\baccount\s+summary\b|\bdeposits?\sand\swithdrawals?\b/i, weight: 7 },
      { pattern: /\bdebit\b|\bcredit\b|\binterest\s+rate\b/i, weight: 3 },
      { pattern: /\bstatement\b/i, weight: 4 }
    ],
    'Payroll': [
      { pattern: /\bpay\s+stub\b|\bpayroll\b|\bearnings\s+statement\b/i, weight: 9 },
      { pattern: /\bgross\s+pay\b|\bnet\s+pay\b|\byear\s+to\s+date\b|\bytd\b/i, weight: 8 },
      { pattern: /\bfederal\s+withholding\b|\bfica\b|\bmedicare\b|\bsocial\s+security\b/i, weight: 7 },
      { pattern: /\bsalary\b|\bwages?\b|\bhourly\s+rate\b|\bpay\s+period\b/i, weight: 6 }
    ],
    'Expense Reports': [
      { pattern: /\bexpense\s+report\b|\breimbursement\s+request\b|\btravel\s+expense\b/i, weight: 9 },
      { pattern: /\bmileage\b|\bper\s+diem\b|\breceipts?\s+attached\b/i, weight: 7 },
      { pattern: /\bexpenses?\b|\breimbursement\b/i, weight: 5 }
    ]
  };

  static categorize(text, enableDebug = false) {
    if (!text || typeof text !== 'string') {
      return { category: 'Other Documents', confidence: 0 };
    }

    const textLower = text.toLowerCase().trim();
    
    // Calculate score for each category
    const scores = {};
    const debugMatches = enableDebug ? {} : null;
    
    for (const [category, patterns] of Object.entries(this.categoryPatterns)) {
      scores[category] = 0;
      if (debugMatches) debugMatches[category] = [];
      
      for (const { pattern, weight } of patterns) {
        if (pattern.test(textLower)) {
          scores[category] += weight;
          if (debugMatches) debugMatches[category].push(pattern.toString());
        }
      }
    }
    
    // Find category with highest score
    let bestCategory = 'Other Documents';
    let highestScore = 0;
    
    for (const [category, score] of Object.entries(scores)) {
      if (score > highestScore) {
        highestScore = score;
        bestCategory = category;
      }
    }
    
    // Calculate confidence percentage
    const maxPossibleScore = Math.max(...Object.values(this.categoryPatterns).map(
      patterns => patterns.reduce((sum, p) => sum + p.weight, 0)
    ));
    const confidence = Math.min((highestScore / maxPossibleScore) * 100, 100);
    
    // Debug logging if enabled
    if (enableDebug && highestScore >= 3) {
      console.log(
        `Categorized as: ${bestCategory} (confidence: ${confidence.toFixed(1)}%)`,
        `\nMatched patterns:`, debugMatches[bestCategory],
        `\nText snippet:`, textLower.slice(0, 200)
      );
    } else if (enableDebug) {
      console.log(
        `Categorized as: Other Documents (confidence: ${confidence.toFixed(1)}%)`,
        `\nNo strong matches found.\nText snippet:`, textLower.slice(0, 200)
      );
    }
    
    // Use confidence threshold to determine if we should categorize
    const result = {
      category: highestScore >= 3 ? bestCategory : 'Other Documents',
      confidence: confidence,
      score: highestScore
    };
    
    return result;
  }

  static addCustomPattern(category, pattern, weight = 5) {
    if (!this.categoryPatterns[category]) {
      this.categoryPatterns[category] = [];
    }
    this.categoryPatterns[category].push({ pattern, weight });
  }

  static getCategories() {
    return Object.keys(this.categoryPatterns);
  }

  static getCategoryStats(results) {
    const stats = {};
    results.forEach(result => {
      const category = result.category || 'Other Documents';
      if (!stats[category]) {
        stats[category] = { count: 0, avgConfidence: 0, totalConfidence: 0 };
      }
      stats[category].count++;
      stats[category].totalConfidence += (result.confidence || 0);
      stats[category].avgConfidence = stats[category].totalConfidence / stats[category].count;
    });
    return stats;
  }
} 