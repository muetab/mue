import variables from 'config/variables';
import { toast } from 'react-toastify';
import { compressAccurately, filetoDataURL } from 'image-conversion';
import videoCheck from 'features/background/api/videoCheck';

function FileUpload({ id, type, accept, loadFunction }) {
  const handleChange = (e) => {
    const reader = new FileReader();
    const file = e.target.files[0];

    if (type === 'settings') {
      reader.readAsText(file, 'UTF-8');
      reader.onload = (e) => {
        return loadFunction(e.target.result);
      };
    } else {
      // background upload
      const settings = {};

      Object.keys(localStorage).forEach((key) => {
        settings[key] = localStorage.getItem(key);
      });

      const settingsSize = new TextEncoder().encode(JSON.stringify(settings)).length;
      if (videoCheck(file.type) === true) {
        if (settingsSize + file.size > 4850000) {
          return toast(variables.getMessage('toasts.no_storage'));
        }

        return loadFunction(file);
      }

      compressAccurately(file, {
        size: 450,
        accuracy: 0.9,
      }).then(async (res) => {
        if (settingsSize + res.size > 4850000) {
          return toast(variables.getMessage('toasts.no_storage'));
        }

        loadFunction({
          target: {
            result: await filetoDataURL(res),
          },
        });
      });
    }
  };

  return (
    <input
      id={id}
      type="file"
      style={{ display: 'none' }}
      accept={accept}
      onChange={handleChange}
    />
  );
}

export { FileUpload as default, FileUpload };
