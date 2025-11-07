import { useEffect } from 'react';

export function IconFontLoader() {
  useEffect(() => {
    // Material Icons font
    const materialIconsFont = require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf');
    const materialIconStyles = `@font-face {
      src: url(${materialIconsFont});
      font-family: MaterialIcons;
    }`;

    // Create stylesheet
    const style = document.createElement('style');
    style.type = 'text/css';

    style.appendChild(document.createTextNode(materialIconStyles));

    // Inject stylesheet
    document.head.appendChild(style);
  }, []);

  return null;
}