import {
  faPowerOff,
  faVolumeXmark,
  faHome,
  faArrowLeft,
  faBars,
} from "@fortawesome/free-solid-svg-icons";

export const remoteButtonGroups = {
  top: [
    {
      code: "POWER",
      label: "Power",
      icon: faPowerOff,
      iconClass: "text-red-400",
    },
    {
      code: "MUTE",
      label: "Mute",
      icon: faVolumeXmark,
    },
  ],

  menu: [
    {
      code: "MENU",
      label: "Menu",
      icon: faBars,
    },
    {
      code: "HOME",
      label: "Home",
      icon: faHome,
    },
  ],

  bottom: [
    {
      code: "BACK",
      label: "Back",
      icon: faArrowLeft,
    },
  ],
};

export const remoteButtonLabels = {
  POWER: "Power",
  MUTE: "Mute",
  MENU: "Menu",
  HOME: "Home",

  UP: "Yukarı",
  DOWN: "Aşağı",
  LEFT: "Sol",
  RIGHT: "Sağ",
  OK: "OK",
  BACK: "Geri",

  VOL_UP: "Ses +",
  VOL_DOWN: "Ses -",
  CH_UP: "Kanal +",
  CH_DOWN: "Kanal -",

  RED: "Kırmızı",
  GREEN: "Yeşil",
  YELLOW: "Sarı",
  BLUE: "Mavi",

  RWD: "Geri Sar",
  FWD: "İleri Sar",
  PLAY: "Oynat",
  PAUSE: "Duraklat",

  SUBTITLE: "Altyazı",
  TEXT: "Teletext",
  RECALL: "Önceki Kanal",
  AUDIO: "Ses Dili",

  INFO: "Bilgi",
  EPG: "Rehber",
  EXIT: "Çıkış",
  FAV: "Favori",
  REC: "Kayıt",

  NUM_1: "1",
  NUM_2: "2",
  NUM_3: "3",
  NUM_4: "4",
  NUM_5: "5",
  NUM_6: "6",
  NUM_7: "7",
  NUM_8: "8",
  NUM_9: "9",
  NUM_0: "0",

  DTV_VCR: "DTV/VCR",
  TV_RADIO: "TV/Radyo",
};
