// app/fontLoader.web.ts
import iconFont from "react-native-vector-icons/Fonts/MaterialIcons.ttf";

const css = `
@font-face {
  font-family: 'MaterialIcons';
  src: url(${iconFont}) format('truetype');
  font-weight: normal;
  font-style: normal;
}
.material-icons, .material-icons-round {
  font-family: 'MaterialIcons';
  speak: none;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 1;
}
`;

const style = document.createElement("style");
style.type = "text/css";
style.appendChild(document.createTextNode(css));
document.head.appendChild(style);
