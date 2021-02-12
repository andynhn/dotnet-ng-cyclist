import { TestBed } from '@angular/core/testing';

import { MemberDetailResolver } from './member-detail.resolver';

describe('MemberDetailResolver', () => {
  let resolver: MemberDetailResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    resolver = TestBed.inject(MemberDetailResolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });
});
