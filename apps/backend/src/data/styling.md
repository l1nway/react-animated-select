# [Styling and Customization]
В случае множества селектов в проекте, чтобы кастомизировать каждый селект отдельно, добавьте уникальный класс родителю через проп `className` и переопределяйте стили или variables вложенных элементов посредством CSS-специфичности и наследования через селекторы потомков.
**Важно про порталы:** Поскольку список опций появляется посредством портализации, они не находятся на одном уровне с селектом, и их кастомизовать нужно отдельно через пропс `optionsClassName`.

# [Animations]
Скорость всех анимаций в селекте можно регулировать пропом duration, смягчение — пропом easing.
Анимацию прозрачности можно отключить пропом animateOpacity={false}.
анимации можно отключить, прокинув пропу duration значение 0.

# [Component Structure & CSS Classes]
Ниже представлена иерархия DOM-элементов библиотеки для корректного переопределения стилей:

дополнительные пояснения состояний:
режим удаления это специальное состояние, которое вызывается, когда пользователь зажал на опцию.

# [Select Content]
```jsx
<div
    ref={`REF ИЗ ПРОПСА ref=`}
    // дополнительно применяются: 
    // rac-disabled-style — когда количество опций равно нулю, или когда проп disabled={true}
    // rac-loading-style — когда проп loading={true}
    // rac-error-style  — когда проп error={true}
    // можно прокинуть свой класс через проп className
    // можно прокинуть свои инлайн стили через проп style
    className='rac-select'>
        <div
            // для опций со значением булево дополнительно применяются классы rac-false-option и rac-true-option соответственно
            // для выбранных опций в режиме множественный опций добавляется инлайн стиль `align-items: flex-start`, по умолчанию `align-items: center`
            className={`rac-select-title-wrapper`}
            style={{alignItems: selectedIDs?.length ? 'flex-start' : 'center'}}
        >
                <div
                    // для выбранных опций в режиме множественный опций добавляется инлайн стиль `align-items: flex-start`, по умолчанию `align-items: center`
                    // в состоянии загрузки для применяется инлайн стиль `height: 100%`, по умолчанию `height: auto`
                    style={{
                        alignItems: selectedIDs?.length ? 'flex-start' : 'center',
                        height: loading ? '100%' : 'auto'
                }}
                    className='rac-select-title'
                >
                        <CSSTransition
                            classNames='rac-slide-left'
                            // доступно только при множественном режиме (multiple={true}), когда выбрана хотя бы одна опция;
                        >
                            <div 
                                style={{
                                transition: `all ${duration}ms ease`,
                                alignItems: 'center',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                display: 'flex',
                                left: 0,
                                top: 0,
                            }}
                            >
                                <div
                                    //дополнительно в режиме удаления добавляется класс --deleting-shake 
                                    className='rac-multiple-selected-option'
                                >
                                    {// содержимое выбранной опции в множественном режиме 
                                    }
                                           
                                        <CSSTransition
                                            classNames='rac-slide-left'
                                            // доступно только при наведении мышью или свайпе
                                        >
                                            <div
                                                // в режиме удаления или при добавленном пропе deleteInline={true} добавляются инлайн стили: `background-color: transparent` и `position: relative`, иначе `background-color: --rac-multiple-del-bg`и `position: absolute`
                                                style={{
                                                    transition: `width ${duration}ms, color ${duration}ms, background-color ${duration}ms`,
                                                    willChange: 'width',
                                                    overflow: 'hidden'
                                                }}
                                                className='rac-multiple-del'
                                            >
                                                {// иконка удаления, можно передать свою иконку через проп `ClearIcon`
                                                }
                                            </div>
                                        </CSSTransition>
                                </div>
                            </div>
                        </CSSTransition>
                        <CSSTransition
                            classNames='rac-slide-left'
                            // доступно только при выбранной опции в одиночном режиме (multiple={false}; по умолчанию) или когда не выбрано ничего
                        >
                            <div 
                                style={{
                                    transition: `all ${duration}ms ease`,
                                    alignItems: 'center',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    left: 0,
                                    top: 0,
                                }}
                            >
                                <span className='rac-title-text'>
                                    {// содержимое опции
                                    }
                                </span>
                                <CSSTransition
                                    classNames='rac-slide-left'
                                    // доступно только при пропе loading={true}
                                >
                                    <div
                                        // значения duration определяются пропом duration={значение в милисекундах}.
                                        style={{
                                            transition: `width ${duration}ms, color ${duration}ms, background-color ${duration}ms`,
                                            willChange: 'width',
                                            overflow: 'hidden'
                                        }}
                                        className='rac-loading-container'
                                    >
                                        <span className='rac-loading-dots'>
                                            <i/><i/><i/>
                                        </span>
                                    </div>
                                </CSSTransition>
                            </div>
                        </CSSTransition>
                </div>

                <div className='rac-select-buttons'>
                    <CSSTransition
                        classNames='rac-slide-left'
                        style={{display: 'grid'}}
                    >
                        <div
                            // значения duration определяются пропом duration={значение в милисекундах}.
                            style={{
                                transition: `width ${duration}ms, color ${duration}ms, background-color ${duration}ms`,
                                willChange: 'width',
                                overflow: 'hidden'
                            }}
                        >
                            {// иконка открытия/закрытия имеет класс rac-select-cancel
                            // можно передать свою иконку через проп `ClearIcon`
                            }
                        </div>
                    </CSSTransition>
                    <CSSTransition
                        // кнопка открытия/закрытия селекта доступна если есть опции, disabled=false, loading=false, error=false, не активирован «режим удаления»
                        classNames='rac-slide-left'
                        style={{display: 'grid'}}
                        timeout={duration}
                    >
                        <div
                            // значения duration определяются пропом duration={значение в милисекундах}.
                            style={{
                                transition: `width ${duration}ms, color ${duration}ms, background-color ${duration}ms`,
                                willChange: 'width',
                                overflow: 'hidden'
                            }}
                        >
                            <span
                                // когда селект открыт дополнительно применяется класс --open
                                className='rac-select-arrow-wrapper'
                            >
                                {// иконка открытия/закрытия имеет класс rac-select-arrow-wrapper
                                // можно передать свою иконку через проп ArrowIcon
                                }
                            </span>
                        </div>
                    </CSSTransition>
                </div>
```
# [Portal Content (Dropdown)]
```jsx
    <CSSTransition
        classNames='rac-options'
        // появляется только когда открыт селект
    >
        <div className='rac-options'>
            <div className='rac-select-list'>
                <div className='rac-select-option'>
                    <span
                        className='rac-option-title'
                        // доступно только наличии опции
                    >
                        {// содержимое опции
                        }
                    </span>
                    <span
                        className='rac-loading-dots'
                        // доступно только при загрузке; используется только для "загрузочной опции" -- когда включены пропы loadButton и loadMore
                    >
                        <i/><i/><i/>
                    </span>
                    <div className='rac-checkbox'>
                        {// иконка открытия/закрытия имеет класс rac-checkmark
                        // можно передать свою иконку через проп `Checkmark`
                        // добавляется дополнительный --checked, если иконка отмечена
                        }
                    </div>
                </div>
            </div>
            {// становится доступным только при пропсах loadButton={true} и hasMore={true}
                <div className='rac-select-option rac-disabled-option rac-loading-option'>
                    <span className='rac-loading-option-title'>Loading</span>
                    <span className='rac-loading-dots'><i/><i/><i/></span>
                </div>
            }
        </div>
    </CSSTransition>
```
# [CSS Standard Styles & Variables]
Ниже приведены стандартные стили библиотеки. Модель должна использовать их для анализа кастомизации через CSS-переменные или переопределение классов.

@media (prefers-reduced-motion: reduce) {
  .rac-select {
    --rac-duration: 1ms;
  }
}

:root {
    --rac-base-red: #e7000b;
    --rac-base-green: #4caf50;
    --rac-base-yellow: #ffc107;

    --rac-select-background: color-mix(in srgb, Canvas 98%, CanvasText 2%);
    --rac-select-hover: color-mix(in srgb, Canvas 95%, CanvasText 5%);
    --rac-select-color: CanvasText;
    --rac-select-border: 2px solid color-mix(in srgb, Canvas 98%, CanvasText 2%);
    --rac-select-border-error: 2px solid color-mix(in srgb, var(--rac-base-red), CanvasText 15%);
    --rac-select-padding: 0em 0.5em;
    --rac-select-min-height: 2em;

    --rac-disabled-opacity: 0.75;

    --rac-title-anim-shift: 4px;
    --rac-title-anim-entry-ease: cubic-bezier(0.34, 1.56, 0.64, 1);
    --rac-title-font-size: 1em;

    --rac-dots-color: currentColor;
    --rac-dots-gap: 3px;
    --rac-dots-padding-left: 0.25em;
    --rac-dots-align: end;
    --rac-dots-animation-duration: 1.4s;
    --rac-dots-animation-delay-1: 0s;
    --rac-dots-animation-delay-2: 0.2s;
    --rac-dots-animation-delay-3: 0.4s;

    --rac-arrow-height: 1em;
    --rac-arrow-width: 1em;
    --rac-arrow-padding: 1px 0 2px;

    --rac-cancel-height: 0.9em;
    --rac-cancel-width: 0.9em;

    --rac-scroll-color: color-mix(in srgb, CanvasText 10%, Canvas);
    --rac-scroll-track: color-mix(in srgb, CanvasText 5%, Canvas);
    --rac-scroll-padding-top: 0.5em;
    --rac-scroll-padding-bottom: 0.5em;

    --rac-option-hover: color-mix(in srgb, CanvasText 6%, Canvas);
    --rac-option-highlight: color-mix(in srgb, CanvasText 10%, Canvas);
    --rac-option-selected: color-mix(in srgb, CanvasText 14%, Canvas);

    --rac-list-background: color-mix(in srgb, Canvas 98%, CanvasText 2%);
    --rac-list-color: CanvasText;
    --rac-list-max-height: 250px;

    --rac-option-padding: 0.5em;
    --rac-option-min-height: 1em;
    --rac-option-gap: 0.5em;
    
    --rac-disabled-option-color: color-mix(in srgb, GrayText, CanvasText 20%);
    --rac-invalid-option-color: color-mix(in srgb, var(--rac-base-red), CanvasText 10%);
    --rac-true-option-color: color-mix(in srgb, var(--rac-base-green), CanvasText 10%);
    --rac-false-option-color: color-mix(in srgb, var(--rac-base-red), CanvasText 10%);
    --rac-warning-option-color: color-mix(in srgb, var(--rac-base-yellow), CanvasText 10%);
    
    --rac-group-header-font-size: 1.25em;
    --rac-group-header-font-weight: bold;
    --rac-group-header-min-height: 1em;
    --rac-group-header-padding: 0.5em;
    --rac-group-arrow-height: 1em;
    --rac-group-arrow-width: 1em;
    --rac-group-arrow-padding: 1px 0 2px;
    --rac-group-container-padding-left: 1em;

    --rac-disabled-group-color: color-mix(in srgb, GrayText, CanvasText 20%);

    --rac-multiple-selected-border: 0.1em solid gray;
    --rac-multiple-selected-radius: 5px;
    --rac-checkbox-border: 1px solid gray;
    --rac-multiple-selected-padding: 0em 0.25em;
    --rac-multiple-selected-margin: 0.25em 0.5em 0.25em 0;
    --rac-multiple-selected-gap: 0.5em 0;
    --rac-multiple-deleting-bg: color-mix(in srgb, var(--rac-base-red) 15%, Canvas);
    --rac-checkbox-margin-right: 0.20em;
    --rac-multiple-selected-min-height: 1.5em;
    --rac-checkbox-size: var(--rac-option-min-height);

    --rac-multiple-del-bg: color-mix(in srgb, var(--rac-base-red) 30%, Canvas);
    --rac-multiple-del-hover-color: var(--rac-base-red);
}

.rac-select {
    background: var(--rac-select-background);
    padding: var(--rac-select-padding);
    border: var(--rac-select-border);
    color: var(--rac-select-color);
    
    min-height: var(--rac-select-min-height);
    /* когда станет стандартом можно будет вынести огромное колво кода */
    interpolate-size: allow-keywords;
    transition:
        background-color var(--rac-duration-base) ease,
        border-color var(--rac-duration-base) ease,
        height var(--rac-duration-base) ease;
    justify-content: space-between;
    box-sizing: border-box;
    cursor: pointer;
    display: flex;

    &:hover {
        background-color: var(--rac-select-hover);
        border-color: var(--rac-select-hover);
    }
}

.rac-loading-style,
.rac-disabled-style {
    opacity: var(--rac-disabled-opacity);
    transition:
        border-color var(--rac-duration-base),
        filter var(--rac-duration-base),
        opacity var(--rac-duration-base);
    cursor: wait;
}

.rac-disabled-style {
    cursor: not-allowed;
}

.rac-error-style {
    border: var(--rac-select-border-error);
    cursor: help;
}

.rac-select-title-wrapper {
    transition: height var(--rac-duration-base) cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    width: 100%;
}

.rac-select-title {
    min-height: var(--rac-select-min-height);
    position: relative;
    flex-wrap: wrap;
    display: flex;
    width: 100%;
}

.rac-spacer {
    min-height: var(--rac-select-min-height);
}

.rac-title-container {
    height: 100%;
}

.rac-title-text {
    /* animation: rac-fade-in var(--rac-duration-base) var(--rac-title-anim-entry-ease); */
    font-size: var(--rac-title-font-size);
    align-content: center;
    display: block;
    height: 100%;
}

@keyframes rac-fade-in {
    from {
        opacity: 0;
        transform: translateY(var(--rac-title-anim-shift));
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.rac-loading-container {
    align-items: end;
    display: grid;
    height: 100%;
}

.rac-loading-dots {
    display: inline-flex;

    --rac-dots-size: calc(var(--rac-title-font-size) / 4); 
    --rac-dots-gap: calc(var(--rac-title-font-size) / 6);
    --rac-dots-padding-left: calc(var(--rac-title-font-size) / 4);
    --rac-dots-padding-bottom: 0.5em;

    gap: var(--rac-dots-gap);
    padding-left: var(--rac-dots-padding-left);
    padding-bottom: var(--rac-dots-padding-bottom);
}

.rac-loading-dots i {
    width: var(--rac-dots-size);
    height: var(--rac-dots-size);
    background: var(--rac-dots-color, currentColor);
    border-radius: 50%;
    animation: blink var(--rac-dots-animation-duration) infinite both;
}

.rac-loading-dots i:nth-child(1) {animation-delay: var(--rac-dots-animation-delay-1);}
.rac-loading-dots i:nth-child(2) {animation-delay: var(--rac-dots-animation-delay-2);}
.rac-loading-dots i:nth-child(3) {animation-delay: var(--rac-dots-animation-delay-3);}

@keyframes blink {
  0%   {opacity: .2;}
  20%  {opacity: 1;}
  100% {opacity: .2;}
}

.rac-select-buttons {
    display: flex;
    align-items: center;
}

.rac-select-cancel {
    height: var(--rac-cancel-height);
    width: var(--rac-cancel-width);

    transition:
        opacity var(--rac-duration-fast),
        border-color var(--rac-duration-fast);
}

.rac-select-arrow-wrapper {
    padding: var(--rac-arrow-padding);
    height: var(--rac-arrow-height);
    width: var(--rac-arrow-width);
    will-change: transform;
    display: block;

    transition:
        transform var(--rac-duration-base) cubic-bezier(.4,0,.2,1),
        padding var(--rac-duration-fast);
    transform-origin: 50% 50%;
    transform: translateZ(0);
}

.rac-select-arrow-wrapper.--open {
    transform: rotate(180deg);
}

.rac-select-arrow, 
.rac-select-cancel {
    object-fit: contain;
}

.rac-select-list {
    background-color: var(--rac-list-background);
    color: var(--rac-list-color);
    max-height: var(--rac-list-max-height);
    overflow-x: hidden; 
    overflow-y: auto;
    scrollbar-color: var(--rac-scroll-color) var(--rac-scroll-track);
    scrollbar-width: thin;
    scrollbar-gutter: stable;
    scroll-behavior: smooth;
    scroll-padding-top: var(--rac-scroll-padding-top);
    scroll-padding-bottom: var(--rac-scroll-padding-bottom);
    transition:
        border-color var(--rac-duration-fast),
        background-color var(--rac-duration-fast),
        opacity var(--rac-duration-base);
}

.rac-select-option {
    transition:
        background-color var(--rac-duration-fast) cubic-bezier(0.4,0,0.2,1);
    min-height: var(--rac-option-min-height);
    padding: var(--rac-option-padding);
    justify-content: space-between;
    gap: var(--rac-option-gap);
    overflow-wrap: anywhere;
    word-break: break-all;
    scrollbar-width: thin;
    align-items: center;
    overflow-x: auto;
    cursor: pointer;
    display: flex;
}

.rac-select-option:not(.rac-disabled-option):not(.rac-group-option):hover {
    background-color: var(--rac-option-hover);
}

.rac-select-option.rac-highlighted {
    background-color: var(--rac-option-highlight);
}

.rac-select-option.rac-selected {
    background-color: var(--rac-option-selected);
}

.rac-select-option.rac-selected.rac-highlighted {
    background-color: var(--rac-option-selected);
}

.rac-option-title {
    text-overflow: ellipsis;
    overflow-wrap: anywhere;
    word-break: break-all;
    text-wrap: wrap;
}

.rac-disabled-option {
    cursor: not-allowed;
    color: var(--rac-disabled-option-color);
}

.rac-invalid-option {
    color: var(--rac-invalid-option-color);
}

.rac-true-option {
    color: var(--rac-true-option-color);
}

.rac-false-option {
    color: var(--rac-false-option-color);
}

.rac-loading-option {
    cursor: wait;
}

.rac-group-header {
    cursor: pointer;
    min-height: var(--rac-group-header-min-height);
    padding: var(--rac-group-header-padding);
    transition:
        background-color var(--rac-duration-fast) cubic-bezier(0.4,0,0.2,1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: var(--rac-group-header-font-weight);
    font-size: var(--rac-group-header-font-size);
}

.rac-group-container {
    padding-left: var(--rac-group-container-padding-left);
}

.rac-group-arrow-wrapper {
    display: block;
    height: var(--rac-group-arrow-height);
    width: var(--rac-group-arrow-width);
    padding: var(--rac-group-arrow-padding);

    will-change: transform;
    transition:
        transform var(--rac-duration-base) cubic-bezier(.4,0,.2,1),
        padding var(--rac-duration-fast);
    transform-origin: 50% 50%;
    transform: translateZ(0);
}

.rac-group-arrow-wrapper.--open {
    transform: rotate(180deg);
}

.rac-disabled-group {
    cursor: not-allowed;
    color: var(--rac-disabled-group-color);
}

.rac-select-selected {
    display: flex;
    align-items: center;
}

.rac-multiple-selected-option {
    transition:
        background-color var(--rac-duration-fast, --rac-duration) cubic-bezier(0.4,0,0.2,1),
        transform var(--rac-duration) ease;
    background-color: color-mix(in srgb, CanvasText 10%, Canvas);
    min-height: var(--rac-multiple-selected-min-height);
    position: relative;
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
    line-height: normal;
    padding: var(--rac-multiple-selected-padding);
    margin: var(--rac-multiple-selected-margin);
    white-space: nowrap;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: none;

    &:hover {
        @media (hover: hover) {
            background-color: color-mix(in srgb, CanvasText 25%, Canvas);
        }
    }
    
}

.rac-multiple-del {
    background-color: var(--rac-multiple-del-bg);
    -webkit-tap-highlight-color: transparent;
    align-items: center;
    position: absolute;
    user-select: none;
    display: grid;
    height: 100%;
    right: 0;

    &:hover {
        color: var(--rac-multiple-del-hover-color);
    }
}

.rac-multiple-option {
    -webkit-tap-highlight-color: transparent;
    user-select: none;
}

.rac-multiple-selected-option.--deleting-shake {
    background-color: var(--rac-multiple-deleting-bg);
    animation: rac-shake 0.3s infinite;
}

@keyframes rac-shake {
    0% {transform: rotate(0deg);}
    25% {transform: rotate(-1deg);}
    75% {transform: rotate(1deg);}
    100% {transform: rotate(0deg);}
}

.rac-checkbox {
    margin-right: var(--rac-checkbox-margin-right);
    min-height: var(--rac-option-min-height);
    min-width: var(--rac-option-min-height);
    border: var(--rac-checkbox-border);
    justify-content: center;
    align-items: center;
    display: flex;
    height: 100%;
}

.rac-checkmark {
    color: var(--rac-base-green);
    opacity: 0;
    max-width: 0;
    max-height: 0;
    transition:
        max-height var(--rac-duration-base),
        max-width var(--rac-duration-base),
        opacity var(--rac-duration-base);
}

.rac-checkmark.--checked {
    max-height: var(--rac-option-min-height);
    max-width: var(--rac-option-min-height);
    opacity: 1;
}