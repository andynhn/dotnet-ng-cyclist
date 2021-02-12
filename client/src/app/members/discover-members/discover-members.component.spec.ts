import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscoverMembersComponent } from './discover-members.component';

describe('DiscoverMembersComponent', () => {
  let component: DiscoverMembersComponent;
  let fixture: ComponentFixture<DiscoverMembersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DiscoverMembersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DiscoverMembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
