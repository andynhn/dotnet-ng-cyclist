import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LandingChatComponent } from './landing-chat.component';

describe('LandingChatComponent', () => {
  let component: LandingChatComponent;
  let fixture: ComponentFixture<LandingChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LandingChatComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LandingChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
