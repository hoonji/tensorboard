/* Copyright 2023 The TensorFlow Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {CustomModalComponent} from './custom_modal_component';
import {CustomModal} from './custom_modal';
import {CommonModule} from '@angular/common';
import {
  ApplicationRef,
  Component,
  ElementRef,
  EventEmitter,
  Output,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';

function waitFrame() {
  return new Promise((resolve) => window.requestAnimationFrame(resolve));
}

@Component({
  selector: 'testable-modal',
  template: `<custom-modal #modal (onOpen)="setOpen()" (onClose)="setClosed()">
    <div>My great content</div>
  </custom-modal> `,
})
class TestableComponent {
  @ViewChild('modal', {static: false})
  modalComponent!: CustomModalComponent;

  @ViewChild('content', {static: false})
  content!: ElementRef;

  isOpen = false;

  @Output() onOpen = new EventEmitter();
  @Output() onClose = new EventEmitter();

  setOpen() {
    this.isOpen = true;
    this.onOpen.emit();
  }

  setClosed() {
    this.isOpen = false;
    this.onClose.emit();
  }

  close() {
    this.modalComponent.close();
  }

  getContentStyle() {
    return (this.modalComponent as any).content.nativeElement.style;
  }

  public openAtPosition(position: {x: number; y: number}) {
    this.modalComponent.openAtPosition(position);
  }
}

@Component({
  selector: 'fake-modal-view-container',
  template: `
    <div #modal_container></div>
    <ng-template #modalTemplate>
      <custom-modal
      (onOpen)="onOpenSpy()"
      >
        <div class="content">abc123</div>
      </custom-modal>
    </ng-template>
  `,
})
class FakeViewContainerComponent {
  @ViewChild('modal_container', {read: ViewContainerRef})
  readonly modalViewContainerRef!: ViewContainerRef;

  @ViewChild('modalTemplate', {read: TemplateRef})
  readonly modalTemplateRef!: TemplateRef<unknown>;

  @ViewChild(CustomModalComponent)
  readonly customModalComponent!: CustomModalComponent;

  readonly onOpenSpy = jasmine.createSpy('onOpenSpy');

  constructor(readonly customModal: CustomModal) {}
}

function createComponent(): ComponentFixture<TestableComponent> {
  const appRef = TestBed.inject(ApplicationRef);
  const fixture = TestBed.createComponent(TestableComponent);
  appRef.components.push(fixture.componentRef);
  fixture.detectChanges();
  return fixture;
}

fdescribe('custom modal service', () => {
  let fixture: ComponentFixture<FakeViewContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FakeViewContainerComponent, CustomModalComponent],
      imports: [CommonModule],
    }).compileComponents();

    const appRef = TestBed.inject(ApplicationRef);
    fixture = TestBed.createComponent(FakeViewContainerComponent);
    appRef.components.push(fixture.componentRef);
    fixture.detectChanges();
  });

  it('creates a modal', async () => {
    const component = fixture.componentInstance;

    component.customModal.createAtPosition(component.modalTemplateRef, {
      x: 10,
      y: 20
    });
    fixture.detectChanges();

    const content = fixture.debugElement.query(By.css('.content'));
    expect(content.nativeElement.innerHTML).toContain('abc123');
    expect(content.nativeElement.style.left).toEqual('10px');
    expect(content.nativeElement.style.top).toEqual('20px');
  });

  it('does not emit onOpen immediately', async () => {
    const component = fixture.componentInstance;

    component.customModal.createAtPosition(component.modalTemplateRef, {
      x: 10,
      y: 20
    });
    fixture.detectChanges();

    expect(component.onOpenSpy).not.toHaveBeenCalled();
  });

  it('emits onOpen on next animation frame', async () => {
    const component = fixture.componentInstance;

    component.customModal.createAtPosition(component.modalTemplateRef, {
      x: 10,
      y: 20
    });
    fixture.detectChanges();
    await waitFrame();

    expect(component.onOpenSpy).toHaveBeenCalled();
  });
});

describe('custom modal', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestableComponent, CustomModalComponent],
      imports: [CommonModule],
    }).compileComponents();
  });

  it('waits a frame before emitting onOpen or onClose', async () => {
    const fixture = createComponent();
    fixture.componentInstance.openAtPosition({x: 0, y: 0});
    expect(fixture.componentInstance.isOpen).toBeFalse();
    await waitFrame();
    expect(fixture.componentInstance.isOpen).toBeTrue();
    fixture.componentInstance.close();
    fixture.detectChanges();
    await waitFrame();
    expect(fixture.componentInstance.isOpen).toBeFalse();
  });

  describe('closing behavior', () => {
    let fixture: ComponentFixture<TestableComponent>;
    beforeEach(async () => {
      fixture = createComponent();
      fixture.componentInstance.openAtPosition({x: 0, y: 0});
      await waitFrame();
    });

    it('closes when escape key is pressed', async () => {
      expect(fixture.componentInstance.isOpen).toBeTrue();
      const event = new KeyboardEvent('keydown', {key: 'escape'});
      document.dispatchEvent(event);
      await waitFrame();

      expect(fixture.componentInstance.isOpen).toBeFalse();
    });

    it('closes when user clicks outside modal', async () => {
      expect(fixture.componentInstance.isOpen).toBeTrue();
      document.body.click();
      await waitFrame();

      expect(fixture.componentInstance.isOpen).toBeFalse();
    });
  });

  describe('ensures content is always within the window', () => {
    beforeEach(() => {
      window.innerHeight = 1000;
      window.innerWidth = 1000;
    });

    it('sets left to 0 if less than 0', async () => {
      const fixture = createComponent();
      fixture.componentInstance.openAtPosition({x: -10, y: 0});
      expect(fixture.componentInstance.isOpen).toBeFalse();
      await waitFrame();
      fixture.detectChanges();

      const content = fixture.debugElement.query(By.css('.content'));
      expect(content.nativeElement.style.left).toEqual('0px');
    });

    it('sets top to 0 if less than 0', async () => {
      const fixture = createComponent();
      fixture.componentInstance.openAtPosition({x: 0, y: -10});
      expect(fixture.componentInstance.isOpen).toBeFalse();
      await waitFrame();
      fixture.detectChanges();

      const content = fixture.debugElement.query(By.css('.content'));
      expect(content.nativeElement.style.top).toEqual('0px');
    });

    it('sets left to maximum if content overflows the window', async () => {
      const fixture = createComponent();
      fixture.componentInstance.openAtPosition({x: 1010, y: 0});
      expect(fixture.componentInstance.isOpen).toBeFalse();
      await waitFrame();
      fixture.detectChanges();
      const content = fixture.debugElement.query(By.css('.content'));
      // While rendering in a test the elements width and height will appear to be 0.
      expect(content.nativeElement.style.left).toEqual('1000px');
    });

    it('sets top to maximum if content overflows the window', async () => {
      const fixture = createComponent();
      fixture.componentInstance.openAtPosition({x: 0, y: 1010});
      expect(fixture.componentInstance.isOpen).toBeFalse();
      await waitFrame();
      fixture.detectChanges();
      const content = fixture.debugElement.query(By.css('.content'));
      // While rendering in a test the elements width and height will appear to be 0.
      expect(content.nativeElement.style.top).toEqual('1000px');
    });
  });
});
