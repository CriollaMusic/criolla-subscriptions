export class PaymentHistory {
    id!: number;
    subscriptionId!: number;
    payPalTransactionId?: string;
    amount!: number;
    currency!: string;
    status!: string;
    paymentDate!: string;
    description?: string;
}
