export class SubscriptionPlanSummary {
    id!: number;
    name?: string;
    price!: number;
}

export class Subscription {
    id!: number;
    userId!: number;
    payPalSubscriptionId!: string;
    plan?: SubscriptionPlanSummary;
    status!: string;
    startDate?: string;
    nextBillingDate?: string;
    cancelDate?: string;
    expirationDate?: string;
    isTrial!: boolean;
    lastPaymentAmount?: number;
    currency!: string;
}
