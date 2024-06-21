/* eslint-disable no-unused-expressions */
// todo: rewrite this mess
import variables from 'config/variables';
import { PureComponent } from 'react';

import PhotoInformation from './components/PhotoInformation';

import EventBus from 'utils/eventbus';

import { supportsAVIF } from './api/avif';
import { getOfflineImage } from './api/getOfflineImage';
import videoCheck from './api/videoCheck';
import { randomColourStyleBuilder } from './api/randomColour';

import './scss/index.scss';
import { decodeBlurHash } from 'fast-blurhash';

import defaults from './options/default';

export default class Background extends PureComponent {
  constructor() {
    super();
    this.state = {
      blob: null,
      style: '',
      url: '',
      currentAPI: '',
      firstTime: false,
      photoInfo: {
        hidden: false,
        offline: false,
        photographerURL: '',
        photoURL: '',
      },
    };
  }

  async setBackground() {
    // clean up the previous image to prevent a memory leak
    if (this.blob) {
      URL.revokeObjectURL(this.blob);
    }

    const backgroundImage = document.getElementById('backgroundImage');

    if (this.state.url !== '') {
      let url = this.state.url;
      const photoInformation = document.querySelector('.photoInformation');

      // just set the background
      if (localStorage.getItem('bgtransition') === 'false') {
        photoInformation?.[(photoInformation.style.display = 'flex')];
        return (backgroundImage.style.background = `url(${url})`);
      }

      backgroundImage.style.background = null;

      if (this.state.photoInfo.blur_hash) {
        backgroundImage.style.backgroundColor = this.state.photoInfo.colour;
        backgroundImage.classList.add('fade-in');
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(32, 32);
        imageData.data.set(decodeBlurHash(this.state.photoInfo.blur_hash, 32, 32));
        ctx.putImageData(imageData, 0, 0);
        backgroundImage.style.backgroundImage = `url(${canvas.toDataURL()})`;
      }

      this.blob = URL.createObjectURL(await (await fetch(url)).blob());
      backgroundImage.classList.add('backgroundTransform');
      backgroundImage.style.backgroundImage = `url(${this.blob})`;
    } else {
      // custom colour
      backgroundImage.setAttribute('style', this.state.style);
    }
  }

  async getAPIImageData(currentPun) {
    let apiCategories;

    try {
      apiCategories = JSON.parse(localStorage.getItem('apiCategories'));
    } catch (error) {
      apiCategories = localStorage.getItem('apiCategories');
    }

    const backgroundAPI = localStorage.getItem('backgroundAPI') || defaults.backgroundAPI;
    const apiQuality = localStorage.getItem('apiQuality') || defaults.apiQuality;
    let backgroundExclude = JSON.parse(localStorage.getItem('backgroundExclude'));
    if (!Array.isArray(backgroundExclude)) {
      backgroundExclude = [];
    }
    if (currentPun) {
      backgroundExclude.push(currentPun);
    }

    let requestURL, data;

    switch (backgroundAPI) {
      case 'unsplash':
      case 'pexels':
        const collection =
          localStorage.getItem('unsplashCollections') || defaults.unsplashCollections;
        if (collection) {
          requestURL = `${variables.constants.API_URL}/images/unsplash?collections=${collection}&quality=${apiQuality}`;
        } else {
          requestURL = `${variables.constants.API_URL}/images/unsplash?categories=${apiCategories || ''}&quality=${apiQuality}`;
        }
        break;
      // Defaults to Mue
      default:
        requestURL = `${variables.constants.API_URL}/images/random?categories=${apiCategories || ''}&quality=${apiQuality}&excludes=${backgroundExclude}`;
        break;
    }

    const accept = 'application/json, ' + ((await supportsAVIF()) ? 'image/avif' : 'image/webp');
    try {
      data = await (await fetch(requestURL, { headers: { accept } })).json();
    } catch (e) {
      // if requesting to the API fails, we get an offline image
      this.setState(getOfflineImage('api'));
      return null;
    }

    let photoURL, photographerURL;

    if (backgroundAPI === 'unsplash') {
      photoURL = data.photo_page;
      photographerURL = data.photographer_page;
    }

    return {
      url: data.file,
      type: 'api',
      currentAPI: backgroundAPI,
      photoInfo: {
        hidden: false,
        category: data.category,
        credit: data.photographer,
        location: data.location.name,
        camera: data.camera,
        url: data.file,
        photographerURL,
        photoURL,
        latitude: data.location.latitude || null,
        longitude: data.location.longitude || null,
        views: data.views || null,
        downloads: data.downloads || null,
        likes: data.likes || null,
        description: data.description || null,
        colour: data.colour,
        blur_hash: data.blur_hash,
        pun: data.pun || null,
      },
    };
  }

  // Main background getting function
  async getBackground() {
    let offline = localStorage.getItem('offlineMode') === 'true';
    if (localStorage.getItem('showWelcome') !== 'false') {
      offline = true;
    }

    const setFavourited = ({ type, url, credit, location, camera, pun, offline }) => {
      if (type === 'random_colour' || type === 'random_gradient') {
        return this.setState({
          type: 'colour',
          style: `background:${url}`,
        });
      }
      this.setState({
        url,
        photoInfo: {
          credit,
          location,
          camera,
          pun,
          offline,
          url,
        },
      });
    };

    const favourited = JSON.parse(localStorage.getItem('favourite'));
    if (favourited) {
      return setFavourited(favourited);
    }

    const type = localStorage.getItem('backgroundType') || defaults.backgroundType;
    switch (type) {
      case 'api':
        if (offline) {
          return this.setState(getOfflineImage('api'));
        }

        // API background
        let data = JSON.parse(localStorage.getItem('nextImage')) || (await this.getAPIImageData());
        localStorage.setItem('nextImage', null);
        if (data) {
          this.setState(data);
          localStorage.setItem('currentBackground', JSON.stringify(data));
          localStorage.setItem(
            'nextImage',
            JSON.stringify(await this.getAPIImageData(data.photoInfo.pun)),
          ); // pre-fetch data about the next image
        }
        break;

      case 'colour':
        let customBackgroundColour = localStorage.getItem('customBackgroundColour');
        // check if its a json object
        if (customBackgroundColour && customBackgroundColour.startsWith('{')) {
          const customBackground = JSON.parse(customBackgroundColour);
          // move to new format
          try {
            localStorage.setItem('customBackgroundColour', customBackground.gradient[0].colour);
            customBackgroundColour = customBackground.gradient.colour;
          } catch (e) {
            // give up
            customBackgroundColour = 'rgb(0,0,0)';
          }
        }
        this.setState({
          type: 'colour',
          style: `background: ${customBackgroundColour || 'rgb(0,0,0)'}`,
        });
        break;

      case 'random_colour':
      case 'random_gradient':
        this.setState(randomColourStyleBuilder(type));
        break;
      case 'custom':
        let customBackground = [];
        const customSaved = localStorage.getItem('customBackground') || defaults.customBackground;
        try {
          customBackground = JSON.parse(customSaved);
        } catch (e) {
          if (customSaved !== '') {
            // move to new format
            customBackground = [customSaved];
          }
          localStorage.setItem('customBackground', JSON.stringify(customBackground));
        }

        // pick random
        customBackground = customBackground[Math.floor(Math.random() * customBackground.length)];

        // allow users to use offline images
        if (offline && !customBackground.startsWith('data:')) {
          return this.setState(getOfflineImage('custom'));
        }

        if (
          customBackground !== '' &&
          customBackground !== 'undefined' &&
          customBackground !== undefined
        ) {
          const object = {
            url: customBackground,
            type: 'custom',
            video: videoCheck(customBackground),
            photoInfo: {
              hidden: true,
            },
          };

          this.setState(object);

          localStorage.setItem('currentBackground', JSON.stringify(object));
        }
        break;

      case 'photo_pack':
        if (offline) {
          return this.setState(getOfflineImage('photo'));
        }

        const photoPack = [];
        const installed = JSON.parse(localStorage.getItem('installed'));
        installed.forEach((item) => {
          if (item.type === 'photos') {
            const photos = item.photos.map((photo) => {
              return photo;
            });

            photoPack.push(...photos);
          }
        });

        if (photoPack.length === 0) {
          return this.setState(getOfflineImage('photo'));
        }

        const photo = photoPack[Math.floor(Math.random() * photoPack.length)];

        this.setState({
          url: photo.url.default,
          type: 'photo_pack',
          video: videoCheck(photo.url.default),
          photoInfo: {
            // todo: finish this
            photographer: photo.photographer,
          },
        });
        break;
      default:
        break;
    }
  }

  componentDidMount() {
    const element = document.getElementById('backgroundImage');

    // this resets it so the fade in and getting background all works properly
    const refresh = () => {
      element.classList.remove('fade-in');
      this.setState({
        url: '',
        style: '',
        type: '',
        video: false,
        photoInfo: {
          hidden: true,
        },
      });
      this.getBackground();
    };

    EventBus.on('refresh', (data) => {
      if (data === 'welcomeLanguage') {
        localStorage.setItem('welcomeImage', JSON.stringify(this.state));
      }

      if (data === 'background') {
        if (localStorage.getItem('background') === 'false') {
          // user is using custom colour or image
          if (this.state.photoInfo.hidden === false) {
            document.querySelector('.photoInformation').style.display = 'none';
          }

          // video backgrounds
          if (this.state.video === true) {
            return (document.getElementById('backgroundVideo').style.display = 'none');
          } else {
            return (element.style.display = 'none');
          }
        }

        // video backgrounds
        if (this.state.video === true) {
          document.getElementById('backgroundVideo').style.display = 'block';
        } else {
          if (this.state.photoInfo.hidden === false) {
            try {
              document.querySelector('.photoInformation').style.display = 'flex';
            } catch (e) {
              // Disregard exception
            }
          }

          element.style.display = 'block';
        }

        const backgroundType = localStorage.getItem('backgroundType') || defaults.backgroundType;

        if (this.state.photoInfo.offline !== true) {
          // basically check to make sure something has changed before we try getting another background
          if (
            backgroundType !== this.state.type ||
            (this.state.type === 'api' &&
              localStorage.getItem('backgroundAPI') !== this.state.currentAPI) ||
            (this.state.type === 'custom' &&
              localStorage.getItem('customBackground') !== this.state.url) ||
            JSON.parse(localStorage.getItem('backgroundExclude')).includes(this.state.photoInfo.pun)
          ) {
            return refresh();
          }
        } else if (backgroundType !== this.state.type) {
          return refresh();
        }
      }

      // uninstall photo pack reverts your background to what you had previously
      if (
        data === 'marketplacebackgrounduninstall' ||
        data === 'backgroundwelcome' ||
        data === 'backgroundrefresh'
      ) {
        refresh();
      }

      if (data === 'backgroundeffect') {
        // background effects so we don't get another image again
        const backgroundFilterSetting =
          localStorage.getItem('backgroundFilter') || defaults.backgroundFilter;
        const backgroundFilter = backgroundFilterSetting && backgroundFilterSetting !== 'none';

        if (this.state.video === true) {
          document.getElementById('backgroundVideo').style.webkitFilter =
            `blur(${localStorage.getItem('blur')}px) brightness(${localStorage.getItem(
              'brightness',
            )}%) ${
              backgroundFilter
                ? backgroundFilterSetting +
                  '(' +
                  localStorage.getItem('backgroundFilterAmount') +
                  '%)'
                : ''
            }`;
        } else {
          element.style.webkitFilter = `blur(${localStorage.getItem(
            'blur',
          )}px) brightness(${localStorage.getItem('brightness')}%) ${
            backgroundFilter
              ? backgroundFilterSetting +
                '(' +
                (localStorage.getItem('backgroundFilterAmount') ||
                  defaults.backgroundFilterAmount) +
                '%)'
              : ''
          }`;
        }
      }
    });

    if (localStorage.getItem('welcomeTab')) {
      return this.setState(JSON.parse(localStorage.getItem('welcomeImage')));
    }

    try {
      document.getElementById('backgroundImage').classList.remove('fade-in');
      document.getElementsByClassName('photoInformation')[0].classList.remove('fade-in');
    } catch (e) {
      // Disregard exception
    }
    this.getBackground();
  }

  // only set once we've got the info
  componentDidUpdate() {
    if (this.state.video === true) {
      return;
    }

    this.setBackground();
  }

  componentWillUnmount() {
    EventBus.off('refresh');
  }

  render() {
    if (this.state.video === true) {
      const enabled = (setting) => {
        return localStorage.getItem(setting) === 'true';
      };

      return (
        <video
          autoPlay
          muted={enabled('backgroundVideoMute')}
          loop={enabled('backgroundVideoLoop')}
          style={{
            WebkitFilter: `blur(${localStorage.getItem(
              'blur',
            )}px) brightness(${localStorage.getItem('brightness') || defaults.brightness}%)`,
          }}
          id="backgroundVideo"
        >
          <source src={this.state.url} />
        </video>
      );
    }

    const backgroundFilter = localStorage.getItem('backgroundFilter') || defaults.backgroundFilter;

    return (
      <>
        <div
          style={{
            WebkitFilter: `blur(${
              localStorage.getItem('blur') || defaults.blur
            }px) brightness(${localStorage.getItem('brightness') || defaults.brightness}%) ${
              backgroundFilter && backgroundFilter !== 'none'
                ? backgroundFilter +
                  '(' +
                  (localStorage.getItem('backgroundFilterAmount') ||
                    defaults.backgroundFilterAmount) +
                  '%)'
                : ''
            }`,
          }}
          id="backgroundImage"
        />
        {this.state.photoInfo.credit !== '' && (
          <PhotoInformation
            info={this.state.photoInfo}
            api={this.state.currentAPI}
            url={this.state.url}
          />
        )}
      </>
    );
  }
}
