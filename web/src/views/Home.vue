<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/logo.png" />
    <AceEditor
      v-model="content"
      @init="editorInit"
      lang="yaml"
      theme="clouds"
      width="100%"
      height="600px"
      :options="{
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        fontSize: 14,
        highlightActiveLine: true,
        enableSnippets: true,
        showLineNumbers: true,
        tabSize: 2,
        showPrintMargin: false,
        showGutter: true,
      }"
      :commands="[
        {
          name: 'save',
          bindKey: { win: 'Ctrl-s', mac: 'Command-s' },
          exec: dataSumit,
          readOnly: true,
        },
      ]"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import HelloWorld from "@/components/HelloWorld.vue"; // @ is an alias to /src

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AceEditor = require("vuejs-ace-editor");

const data = `spaces:
  kitchen:
    floorPlan:
      - $anchor: roomCorner
      - wall:
          name: entryWall
          length: 73" left
          height: 105.5"
          thickness: 4-1/4"
      - $rotate: 90deg right
      - $anchor: kitchenCorner
      - wall:
          name: pantrywall
          length: 41" left
      - $rotate: 90deg cw
      - wall:
          length: 24-3/4" left
      - $rotate: 90deg ccw
      - wall:
          name: cabinetWall
          length: 46-3/4" 35.5" 48-3/4" left
      - $rotate: 90deg ccw
      - wall:
          name: diningWall
          length: 164-3/4" left
      - $rotate: 90deg ccw
      - wall:
          name: windowWall
          length: 34-7/8" 1.5" 1" 66-3/4" left
          thickness: 10"
      - $anchor: nookRightCorner
      - $rotate: 30deg cw
      - wall:
          name: nook1
          length: 48" left
      - $rotate: -30 deg cw
      - wall:
          name: nook2
          length: 45" left
      - $rotate: -30 deg cw
      - wall:
          name: nook3
          length: 48" left
      - $rotate: 30 deg cw
      - wall:
          length: 155.5" 26" left
      - $rotate: 90 deg ccw  
      - wall:
          length: 198" left
      - $rotate: 90 deg ccw  
      - wall:
          length: 155.5" 26" left
          thickness: 4-1/4"
      - $rotate: 90 deg ccw 
      - wall:
          length: 46" left
          height: 36"
          
          `;


@Component({
  components: {
    HelloWorld,
    AceEditor,
  },
})
export default class Home extends Vue {
  content = data;

  dataSumit() {
    // foo
  }
  editorInit() {
    require("brace/ext/language_tools"); //language extension prerequsite...
    //require("brace/mode/html");
    require("brace/mode/yaml"); //language
    //require("brace/mode/yaml_highlight_rules"); //language

    //require("brace/mode/less");
    require("brace/theme/monokai");
    require("brace/theme/clouds");
    require("brace/snippets/yaml"); //snippet
  }
}

</script>
