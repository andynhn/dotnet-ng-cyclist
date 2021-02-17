import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberEditCredentialsComponent } from './member-edit-credentials.component';

describe('MemberEditCredentialsComponent', () => {
  let component: MemberEditCredentialsComponent;
  let fixture: ComponentFixture<MemberEditCredentialsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MemberEditCredentialsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MemberEditCredentialsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
