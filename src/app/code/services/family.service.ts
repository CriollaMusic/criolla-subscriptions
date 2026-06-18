import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { FamilyInviteDetails, FamilyMember, FamilyOperationResult } from '../models/Entity/familyMember';

@Injectable({
  providedIn: 'root'
})
export class FamilyService {
  constructor(private http: HttpClient) { }

  getMembers(ownerUserId: number): Observable<Array<FamilyMember>> {
    return this.http.get<Array<FamilyMember>>(`${environment.userApi}Family/members/${ownerUserId}`);
  }

  invite(ownerUserId: number, email: string): Observable<FamilyMember> {
    return this.http.post<FamilyMember>(`${environment.userApi}Family/invite`, { ownerUserId, email });
  }

  remove(ownerUserId: number, memberId: number): Observable<FamilyOperationResult> {
    return this.http.post<FamilyOperationResult>(`${environment.userApi}Family/remove`, { ownerUserId, memberId });
  }

  getInvite(token: string): Observable<FamilyInviteDetails> {
    return this.http.get<FamilyInviteDetails>(`${environment.userApi}FamilyInvite/${token}`);
  }

  acceptInvite(token: string): Observable<FamilyOperationResult> {
    return this.http.post<FamilyOperationResult>(`${environment.userApi}FamilyInvite/accept`, { token });
  }
}
