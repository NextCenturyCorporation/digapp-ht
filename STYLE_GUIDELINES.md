#dig-polymer style guidelines

This is compact, but it expands to a lot of new concepts and rules.  The purpose of these styling guidelines is to ensure that all elements are consistent with Polymer's paper elements, and also because applying themes and styling globally is handled a little bit different than a framework such as bootstrap.

The objective is to leverage material design and existing components so that we do not spend time re-inventing this huge body of work.  There is still plenty of room for styling such as layout, size, font selection, but not a lot of flexibility for things like how buttons look (besides color) and how they behave.

1. To encapsulate style rules in a component, use Shadow DOM styling rules.  IOW, add a style tag to the component.  See https://www.polymer-project.org/1.0/docs/devguide/styling.html
2. Because we use Polymer paper-elements, adhere to all material design guidelines:
    * [material palette for theming](https://www.materialpalette.com)
    * choose typography, colors, theme, elevations from [`<paper-styles`>](https://github.com/PolymerElements/paper-styles) component
    * use material such as `<card>` or `<paper-material>` for content.  IOW, avoid using background/bottom layer for text, icons, graphics, controls, etc.
    * use consistent, non-zero elevation for buttons, FAB per MD guidelines: https://www.google.com/design/spec/components/buttons.html#buttons-button-types
3. For application wide theming and layout, use app-theming style module
4. For visual elements, use style module instead of duplicating common style rules in the component
5. Use var mix-in and @apply to give element a theming interface.  A common and consistent mix-in naming convention will allow all elements to adopt a global theme that is defined in app-theme.html.
6. Use Flexbox layout with iron-flex-layout (classes and/or mixins)
7. Use paper elements to maintain material design metaphore and reduce workload, but native elements may be a better substitute in certain cases.


###See polymer paper elements catalog and google web components for examples on how they used shadow DOM encapsulation, mix-ins, and style module imports.
