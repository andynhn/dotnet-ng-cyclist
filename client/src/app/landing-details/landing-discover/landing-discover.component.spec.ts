import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LandingDiscoverComponent } from './landing-discover.component';

describe('LandingDiscoverComponent', () => {
  let component: LandingDiscoverComponent;
  let fixture: ComponentFixture<LandingDiscoverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LandingDiscoverComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LandingDiscoverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
