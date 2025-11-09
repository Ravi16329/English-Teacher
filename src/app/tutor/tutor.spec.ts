import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tutor } from './tutor';

describe('Tutor', () => {
  let component: Tutor;
  let fixture: ComponentFixture<Tutor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tutor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Tutor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
