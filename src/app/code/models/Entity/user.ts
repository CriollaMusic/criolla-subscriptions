import { BaseEntity } from "../shared/BaseEntity";

export class User extends BaseEntity {
    name!: string;
    lastName!: string;
    birthDate!: string;
    email!: string;
    phoneNumber!: string;
    password!: string;
    permissions: string = '';
}
