
// $(() => {
//     $('#myCollapsible').collapse({
//         toggle: false
//     })
//     $('#btn').on('click', () => {
//         $('#myCollapsible').collapse('toggle');
//     });
//     $('#myCollapsible').css('background', 'red');
// });

angular.module('app', ['ngAnimate']);


angular.module('app')
    .directive('uibCollapse', ['$animate', '$q', '$parse', '$injector', function ($animate, $q, $parse, $injector) {
        var $animateCss = $injector.has('$animateCss') ? $injector.get('$animateCss') : null;
        return {
            link: function (scope, element, attrs) {
                var expandingExpr = $parse(attrs.expanding),
                    expandedExpr = $parse(attrs.expanded),
                    collapsingExpr = $parse(attrs.collapsing),
                    collapsedExpr = $parse(attrs.collapsed),
                    horizontal = false,
                    css = {},
                    cssTo = {};

                init();

                function init() {
                    horizontal = !!('horizontal' in attrs);
                    if (horizontal) {
                        css = {
                            width: ''
                        };
                        cssTo = { width: '0' };
                    } else {
                        css = {
                            height: ''
                        };
                        cssTo = { height: '0' };
                    }
                    if (!scope.$eval(attrs.uibCollapse)) {
                        element.addClass('in')
                            .addClass('collapse')
                            .attr('aria-expanded', true)
                            .attr('aria-hidden', false)
                            .css(css);
                    }
                }

                function getScrollFromElement(element) {
                    if (horizontal) {
                        return { width: element.scrollWidth + 'px' };
                    }
                    return { height: element.scrollHeight + 'px' };
                }

                function expand() {
                    if (element.hasClass('collapse') && element.hasClass('in')) {
                        return;
                    }

                    $q.when(expandingExpr(scope))
                        .then(function () {
                            element.removeClass('collapse')
                                .addClass('collapsing')
                                .attr('aria-expanded', true)
                                .attr('aria-hidden', false);

                            if ($animateCss) {
                                $animateCss(element, {
                                    addClass: 'in',
                                    easing: 'ease',
                                    css: {
                                        overflow: 'hidden'
                                    },
                                    to: getScrollFromElement(element[0])
                                }).start()['finally'](expandDone);
                            } else {
                                $animate.addClass(element, 'in', {
                                    css: {
                                        overflow: 'hidden'
                                    },
                                    to: getScrollFromElement(element[0])
                                }).then(expandDone);
                            }
                        }, angular.noop);
                }

                function expandDone() {
                    element.removeClass('collapsing')
                        .addClass('collapse')
                        .css(css);
                    expandedExpr(scope);
                }

                function collapse() {
                    if (!element.hasClass('collapse') && !element.hasClass('in')) {
                        return collapseDone();
                    }

                    $q.when(collapsingExpr(scope))
                        .then(function () {
                            element
                                // IMPORTANT: The width must be set before adding "collapsing" class.
                                // Otherwise, the browser attempts to animate from width 0 (in
                                // collapsing class) to the given width here.
                                .css(getScrollFromElement(element[0]))
                                // initially all panel collapse have the collapse class, this removal
                                // prevents the animation from jumping to collapsed state
                                .removeClass('collapse')
                                .addClass('collapsing')
                                .attr('aria-expanded', false)
                                .attr('aria-hidden', true);

                            if ($animateCss) {
                                $animateCss(element, {
                                    removeClass: 'in',
                                    to: cssTo
                                }).start()['finally'](collapseDone);
                            } else {
                                $animate.removeClass(element, 'in', {
                                    to: cssTo
                                }).then(collapseDone);
                            }
                        }, angular.noop);
                }

                function collapseDone() {
                    element.css(cssTo); // Required so that collapse works when animation is disabled
                    element.removeClass('collapsing')
                        .addClass('collapse');
                    collapsedExpr(scope);
                }

                scope.$watch(attrs.uibCollapse, function (shouldCollapse) {
                    if (shouldCollapse) {
                        collapse();
                    } else {
                        expand();
                    }
                });
            }
        };
    }]);

angular
    .module('app')
    // .directive('accordionGridHeaderCellDate', function () {
    //     return {
    //         scope: {
    //             value: '=',
    //         },
    //         template: `
    //             <span>date: {{value}}</span>
    //         `,
    //     };
    // })
    .directive('accordionGridHeaderCell', function ($compile, $templateCache) {
        return {
            scope: {
                options: '=',
                item: '=',
                column: '=',
            },
            link: function (scope, element) {
                let childScope;

                function updateCell() {
                    if (childScope) { //no leaking watchers
                        childScope.$destroy();
                        element.empty();
                    }
                    childScope = scope.$new();
                    childScope.value = scope.item[scope.column.field];

                    let template = angular.element($templateCache.get(`accordionGrid/${scope.column.type}`));
                    element.append(template);
                    $compile(template)(childScope);
                    //compile after add - https://stackoverflow.com/questions/31727370/angularjs-dynamic-inputs-with-form-validation
                }

                updateCell();
            }
        };
    })
    .directive('accordionGridItem', function () {
        return {
            scope: {
                options: '=',
                item: '=',
            },
            template: `
            <div class="item">
                <div class="item-header">
                    <accordion-grid-header-cell ng-repeat="column in options.columns track by column.field"  item="item" options="options" column="column" />
                    <div class="actions">
                        actions
                    </div>
                </div>  
            <div>body</div>
          </div>
      `,
        };
    })
    .directive('accordionGrid', function ($templateCache) {
        $templateCache.put('accordionGrid/date', '<span>date: {{value}}</span>');
        $templateCache.put('accordionGrid/fileType', '<span>fileType: {{value}}</span>');
        $templateCache.put('accordionGrid/nameValue', '<span><b>{{value.name}}</b>:{{value.value}}</span>');

        return {
            scope: {
                options: '=',
            },
            template: `
        <div> 
          <accordion-grid-item ng-repeat="item in options.items track by item.id" item="item" options="options"/>
        </div>
      `,
        };
    })
    .controller('MainCtrl', function ($scope, $q) {
        $scope.isNavCollapsed = true;
        $scope.isCollapsed = false;
        $scope.isCollapsedHorizontal = false;

        $scope.options = {
            columns: [
                {
                    field: 'date',
                    width: '200px',
                    type: 'date'
                },
                {
                    field: 'fileType',
                    width: '200px',
                    type: 'fileType'
                },
                {
                    field: 'nameAndSomething',
                    width: '200px',
                    type: 'nameValue'
                },
            ],
            itemActions: [
                {
                    label: 'Edit',
                    action: item => {
                        console.log('hello');
                        return $q.when();
                    },
                    condition: item => item.id % 2,
                },
            ],
            items: [
                {
                    id: 1,
                    date: new Date(),
                    fileType: 'jpg',
                    nameAndSomething: {
                        name: 'Jozko Mrkvicka',
                        value: 'lorem ipsum a tak dalej'
                    }
                },
                {
                    id: 2,
                    date: new Date(),
                    fileType: 'png',
                    nameAndSomething: {
                        name: 'Jozko Mrkvicka',
                        value: 'lorem ipsum a tak dalej'
                    }
                },
                {
                    id: 3,
                    date: new Date(),
                    fileType: 'pdf',
                    nameAndSomething: {
                        name: 'Jozko Mrkvicka',
                        value: 'lorem ipsum a tak dalej'
                    }
                },
            ],
        };

        $scope.name = 'app';
    });
