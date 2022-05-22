import variables from 'modules/variables';
import { PureComponent } from 'react';
import { toast } from 'react-toastify';
import { compressAccurately, filetoDataURL } from 'image-conversion';
import { videoCheck } from 'modules/helpers/background/widget';

export default class FileUpload extends PureComponent {
  getMessage = (text) => variables.language.getMessage(variables.languagecode, text);

  componentDidMount() {
    document.getElementById(this.props.id).onchange = (e) => {
      const reader = new FileReader();
      const file = e.target.files[0];

      if (this.props.type === 'settings') {
        reader.readAsText(file, 'UTF-8');
      } else {
        // background upload
        const settings = {};

        Object.keys(localStorage).forEach((key) => {
          settings[key] = localStorage.getItem(key);
        });

        const settingsSize = new TextEncoder().encode(JSON.stringify(settings)).length;
        if (videoCheck(file) === true) {
          if (settingsSize + file.size > 4850000) {
            return toast('Not enough storage!');
          }

          return this.props.loadFunction(file);
        }

        // todo: change number
        compressAccurately(file, 200).then(async (res) => {
          if (settingsSize + res.size > 4850000) {
            return toast('Not enough storage!');
          }

          this.props.loadFunction({
            target: {
              result: await filetoDataURL(res),
            },
          });
        });
      }
    };
  }

  render() {
    return (
      <input
        id={this.props.id}
        type="file"
        style={{ display: 'none' }}
        accept={this.props.accept}
      />
    );
  }
}
