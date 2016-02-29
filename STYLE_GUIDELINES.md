#dig-polymer styling guidelines
1. To encapsulate style rules in a component, use Shadow DOM styling rules.  IOW, add a style tag to the component.  See https://www.polymer-project.org/1.0/docs/devguide/styling.html

2. Because we use Polymer paper-elements, adhere to all material design guidelines:
..* [material palette for theming](https://www.materialpalette.com)

..* choose typography, colors, theme, elevations from [<paper-styles>](https://github.com/PolymerElements/paper-styles) component

..* use material such as <card> or <paper-material> for content.  IOW, avoid using background/bottom layer for text, icons, graphics, controls, etc.
..* use elevation for buttons, FAB per MD guidelines: https://www.google.com/design/spec/components/buttons.html#buttons-button-types

3. For application wide theming and layout, use app-theming style module
4. For visual elements, use style module instead of duplicating common style rules in the component
5. Use var mix-in and @apply to give element a theming interface.  A common and consistent mix-in naming convention will allow all elements to adopt a global theme that is defined in app-theme.html
Probably avoid different pieces of paper for sections of an entity


See polymer paper elements catalog and google web components for examples on how they used shadow DOM encapsulation, mix-ins, and style module imports.
