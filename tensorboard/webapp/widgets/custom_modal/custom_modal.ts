import {
  ApplicationRef,
  Injectable,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import {CustomModalComponent} from './custom_modal_component';

/**
 * App root component must define a ViewContainerRef named `modalViewContainerRef`
 * e.g.:
 * 
 * // Template file
 * <div #modal_container></div>
 * 
 * // Component file
 * class MyAppRoot {
 *   @ViewChild('modal_container', {read: ViewContainerRef})
 *   readonly modalViewContainerRef!: ViewContainerRef;
 *   ...
 * }
 */
@Injectable({providedIn: 'root'})
export class CustomModal {
  constructor(private appRef: ApplicationRef) {}

  private getModalViewContainerRef(): ViewContainerRef | undefined {
    const appInstance = this.appRef.components[0].instance;
    let viewContainerRef: ViewContainerRef = appInstance.modalViewContainerRef;
    if (!viewContainerRef) {
      console.warn(
        'For proper custom modal function, an element with reference #modal_container is required in the root component.'
      );
      return;
    }
    return viewContainerRef;
  }

  createAtPosition(
    templateRef: TemplateRef<unknown>,
    position: {x: number; y: number}
  ): CustomModalComponent | undefined {
    const viewContainerRef = this.getModalViewContainerRef();
    if (!viewContainerRef) return;

    const embeddedViewRef = viewContainerRef.createEmbeddedView(templateRef);
    const modalComponent = CustomModalComponent.latestInstance;
    modalComponent.parentEmbeddedViewRef = embeddedViewRef;
    modalComponent.openAtPosition(position);
    return modalComponent;
  }

  runChangeDetection() {
    const viewContainerRef = this.getModalViewContainerRef();
    if (!viewContainerRef) return;
    for (let i = 0; i < viewContainerRef.length; i++) {
      viewContainerRef.get(i)?.detectChanges();
    }
  }

  closeAll() {
    const viewContainerRef = this.getModalViewContainerRef();
    if (!viewContainerRef) return;
    viewContainerRef.clear();
  }
}
