import { BaseEntity } from "../shared/BaseEntity";

export class PlanAccountType {
    id!: number;
    name?: string;
    price!: number;
}

export class SubscriptionPlan extends BaseEntity {
    payPalPlanId!: string;
    onvoPriceId?: string;
    paymentProvider?: string;
    accountType?: PlanAccountType;
    billingFrequency!: string;
    price!: number;
    currency!: string;
    description?: string;
    features?: string;
    hasTrial!: boolean;
    trialDays?: number;
    displayOrder!: number;
    isActive!: boolean;
    discountPercentage?: number;
    originalPrice?: number;
}
