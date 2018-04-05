import { Component, Injector, Input, DebugElement } from "@angular/core";
import { async, inject, TestBed, ComponentFixture } from "@angular/core/testing";
import { By } from "@angular/platform-browser";

import { UIRouter } from '@uirouter/core';
import { UIRouterModule } from "@uirouter/angular";

import { NgxUIRouterUrlTypeFactoryModule } from "../module";
import { UrlType } from "./url-type-factory.service";
import { configure } from "./url-type-factory";


@Component({
    template: `<ui-view></ui-view>`
})
export class AppComponent {
}


@Component({
    template: `SyncTestComponent`
})
export class SyncTestComponent {
    @Input() param1: any;
}


@Component({
    template: `AsyncTestComponent`
})
export class AsyncTestComponent {
    @Input() param1: any;
}


@Component({
    template: `SyncAsyncTestComponent`
})
export class SyncAsyncTestComponent {
    @Input() param1: any;
    @Input() param2: any;
}


export class SyncTestType implements UrlType<any> {
    name = 'SyncTest';
    match = /\d+/;
    bindable = true;

    represent(obj: any): string {
        return String(obj.pk);
    };

    resolve(matched: string, injector: Injector) {
        return {
            'pk': 1,
            'attr1': 'sync-value1',
            'attr2': 'sync-value2',
        }
    };

}


export class AsyncTestType implements UrlType<any> {
    name = 'AsyncTest';
    match = /\d+/;
    bindable = true;

    represent(obj: any): string {
        return String(obj.pk);
    };

    resolve(matched: string, injector: Injector) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    'pk': 1,
                    'attr1': 'async-value1',
                    'attr2': 'async-value2',
                });
            })
        })
    };

}


export const routingConfig = {
    states: [
        {
            name: 'sync',
            url: '/sync/{param1:SyncTest}',
            component: SyncTestComponent,
        },
        {
            name: 'async',
            url: '/async/{param1:AsyncTest}',
            component: AsyncTestComponent,
        },
        {
            name: 'sync-async',
            url: '/sync-async/{param1:SyncTest}/{param2:AsyncTest}',
            component: SyncAsyncTestComponent,
        },
    ],
    useHash: true,
    config: configure,
};


describe('UrlTypeFactoryService', () => {
    let
        fixture: ComponentFixture<AppComponent> = null,
        router: UIRouter = null,
        appComponent: DebugElement = null;

    beforeEach(
        async(() => {
            TestBed.configureTestingModule({
                declarations: [
                    AppComponent,
                    SyncTestComponent,
                    AsyncTestComponent,
                    SyncAsyncTestComponent,
                ],
                imports: [
                    UIRouterModule.forRoot(routingConfig),
                    NgxUIRouterUrlTypeFactoryModule.forRoot({
                        types: [
                            SyncTestType,
                            AsyncTestType,
                        ]
                    }),
                ],
            });

            fixture = TestBed.createComponent(AppComponent);
            fixture.detectChanges();

            appComponent = fixture.debugElement;

            router = fixture.debugElement.injector.get(UIRouter);
        })
    );

    it('Does resolve synchronous url types',
        async(
            inject([], () => {
                router.stateService.go('sync', {param1: 1}).then(() => {
                    let
                        params = router.globals.params;

                    expect(params.param1.pk).toBe(1);
                    expect(params.param1.attr1).toBe('sync-value1');
                    expect(params.param1.attr2).toBe('sync-value2');
                });
            })
        )
    );

    it('Does resolve asynchronous url types',
        async(
            inject([], () => {
                router.stateService.go('async', {param1: 1}).then(() => {
                    let
                        params = router.globals.params;

                    expect(params.param1.pk).toBe(1);
                    expect(params.param1.attr1).toBe('async-value1');
                    expect(params.param1.attr2).toBe('async-value2');
                });
            })
        )
    );

    it('Does resolve synchronous and asynchronous url types',
        async(
            inject([], () => {
                router.stateService.go('sync-async', {param1: 1, param2: 1}).then(() => {
                    let
                        params = router.globals.params;

                    expect(params.param1.pk).toBe(1);
                    expect(params.param1.attr1).toBe('sync-value1');
                    expect(params.param1.attr2).toBe('sync-value2');

                    expect(params.param2.pk).toBe(1);
                    expect(params.param2.attr1).toBe('async-value1');
                    expect(params.param2.attr2).toBe('async-value2');
                });
            })
        )
    );

    it('Does bind synchronous url types',
        async(
            inject([], () => {
                router.stateService.go('sync', {param1: 1}).then(() => {
                    let
                        component = appComponent.query(By.directive(SyncTestComponent)).componentInstance;

                    expect(component.param1.pk).toBe(1);
                    expect(component.param1.attr1).toBe('sync-value1');
                    expect(component.param1.attr2).toBe('sync-value2');
                });
            })
        )
    );

    it('Does bind asynchronous url types',
        async(
            inject([], () => {
                router.stateService.go('async', {param1: 1}).then(() => {
                    let
                        component = appComponent.query(By.directive(AsyncTestComponent)).componentInstance;

                    expect(component.param1.pk).toBe(1);
                    expect(component.param1.attr1).toBe('async-value1');
                    expect(component.param1.attr2).toBe('async-value2');
                });
            })
        )
    );

    it('Does bind synchronous and asynchronous url types',
        async(
            inject([], () => {
                router.stateService.go('sync-async', {param1: 1, param2: 1}).then(() => {
                    let
                        component = appComponent.query(By.directive(SyncAsyncTestComponent)).componentInstance;

                    expect(component.param1.pk).toBe(1);
                    expect(component.param1.attr1).toBe('sync-value1');
                    expect(component.param1.attr2).toBe('sync-value2');

                    expect(component.param2.pk).toBe(1);
                    expect(component.param2.attr1).toBe('async-value1');
                    expect(component.param2.attr2).toBe('async-value2');
                });
            })
        )
    );

    it('Does represent primitive in url',
        async(
            inject([], () => {
                let
                    url = router.stateService.href('sync-async', {param1: 1, param2: 2});

                expect(url).toBe('#/sync-async/1/2');
            })
        )
    );

    it('Does represent objects in url',
        async(
            inject([], () => {
                let
                    url = router.stateService.href('sync-async', {
                        param1: {
                            pk: 1,
                        },
                        param2: {
                            pk: 2,
                        }
                    });

                expect(url).toBe('#/sync-async/1/2');
            })
        )
    );

});