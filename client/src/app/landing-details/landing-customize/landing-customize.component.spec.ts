import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LandingCustomizeComponent } from './landing-customize.component';

describe('LandingCustomizeComponent', () => {
  let component: LandingCustomizeComponent;
  let fixture: ComponentFixture<LandingCustomizeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LandingCustomizeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LandingCustomizeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
