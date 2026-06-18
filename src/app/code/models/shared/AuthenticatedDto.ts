import { BaseEntity } from "./BaseEntity";

export class AuthenticationDto {
    email!: string;
    password!: string;
    ipAddress!: string;
}

export class AuthenticatedDto {
    id!: number;
    email!: string;
    firstName!: string;
    lastName!: string;
    permissions!: string;
    token!: Token;
}

export class Token extends BaseEntity {
    value!: string;
}
