/**
 * Exportações centralizadas dos geradores de relatórios
 */

export { generateServiceOrderReport } from './service-order.report';
export { generateCashFlowReport } from './cashflow.report';
export { generateLowStockReport } from './low-stock.report';
export { generatePayslipPDF } from './payslip.report';
export { generatePurchaseOrderPDF } from './purchase-order.report';
export { generateExpensePDF } from './expense.report';

export type { CashFlowReportData, CashFlowEntry, CashFlowSummary, CategorySummary } from './cashflow.report';
export type { LowStockReportData, Product } from './low-stock.report';
export type { PayslipData } from './payslip.report';
export type { PurchaseOrderData, PurchaseOrderTranslations } from './purchase-order.report';
export type { ExpenseData, ExpenseTranslations } from './expense.report';
