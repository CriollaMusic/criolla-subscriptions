import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FamilyInviteDetails } from 'src/app/code/models/Entity/familyMember';
import { FamilyService } from 'src/app/code/services/family.service';
import { TranslateService } from 'src/app/code/services/translate.service';

@Component({
  selector: 'app-accept-invite',
  templateUrl: './accept-invite.component.html',
  styleUrls: ['./accept-invite.component.css']
})
export class AcceptInviteComponent implements OnInit {

  token = '';
  loading = true;
  accepting = false;
  invite?: FamilyInviteDetails;
  accepted = false;
  resultMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private familyService: FamilyService,
    public translateService: TranslateService) { }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.loading = false;
      return;
    }
    this.familyService.getInvite(this.token).subscribe({
      next: (res: FamilyInviteDetails) => {
        this.invite = res;
        this.accepted = res?.status === 'ACCEPTED';
        this.loading = false;
      },
      error: () => {
        this.invite = { found: false } as FamilyInviteDetails;
        this.loading = false;
      }
    });
  }

  get isValid(): boolean {
    return !!this.invite && this.invite.found && this.invite.status !== 'REMOVED';
  }

  accept(): void {
    if (!this.token || this.accepting) {
      return;
    }
    this.accepting = true;
    this.familyService.acceptInvite(this.token).subscribe({
      next: (res) => {
        this.accepting = false;
        this.accepted = true;
        this.resultMessage = res?.message || this.translateService.getText('account.accept.success');
      },
      error: (err) => {
        this.accepting = false;
        this.resultMessage = err?.error?.message || this.translateService.getText('account.accept.error');
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
