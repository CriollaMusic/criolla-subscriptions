export class BaseEntity {
    id!: number;
    creationDate!: string;
    lastUpdated!: string;
    status!: StatusEnum;
}

export enum StatusEnum {
    Active = 1,
    InActive = 2,
    PendingVerification = 3,
    Deleted = 4
}
