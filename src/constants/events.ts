import { FlightEvent } from '../types';

export const FLIGHT_EVENTS: FlightEvent[] = [
  {
    id: 'fuel-leak',
    title: 'Kegagalan Talian Bahan Api',
    description: 'Sensor mengesan retakan mikro pada talian bahan api utama. Oksigen cecair sedang bocor ke angkasa lepas.',
    type: 'malfunction',
    choices: [
      {
        label: 'Tampalan Kecemasan',
        description: 'Cuba tampalan perisian jauh untuk memintas injap. Berisiko tetapi menjimatkan bahan api.',
        impact: {
          fuel: -200,
          message: 'Tampalan berjaya, tetapi sedikit bahan api hilang semasa prosedur.'
        }
      },
      {
        label: 'Kedapkan Bahagian',
        description: 'Kedapkan sepenuhnya bahagian tangki yang terjejas. Selamat tetapi mengurangkan kapasiti keseluruhan.',
        impact: {
          fuel: -1000,
          message: 'Bahagian dikedapkan. Kebocoran bahan api dihentikan, tetapi jarak anda berkurang dengan ketara.'
        }
      }
    ]
  },
  {
    id: 'meteoroid-shower',
    title: 'Kumpulan Meteoroid',
    description: 'Radar jarak jauh menunjukkan sekumpulan serpihan berkelajuan tinggi pada laluan pintasan.',
    type: 'meteoroid',
    choices: [
      {
        label: 'Gerakan Mengelak',
        description: 'Hidupkan enjin untuk menukar trajektori. Menggunakan bahan api tetapi mengelakkan impak.',
        impact: {
          fuel: -500,
          velocity: { x: 50, y: -20 },
          message: 'Gerakan selesai. Kumpulan meteoroid berlalu tanpa sebarang kerosakan.'
        }
      },
      {
        label: 'Bersedia untuk Impak',
        description: 'Halakan perisai haba ke arah serpihan dan berdoa.',
        impact: {
          damage: true,
          message: 'Pelbagai impak dikesan! Integriti badan kapal terjejas, tetapi sistem masih berfungsi.'
        }
      }
    ]
  },
  {
    id: 'strange-signal',
    title: 'Transmisi Tidak Dikenali',
    description: 'Isyarat aneh yang berulang dikesan pada jalur angkasa dalam. Ia nampaknya datang dari Bulan.',
    type: 'communication',
    choices: [
      {
        label: 'Analisis Isyarat',
        description: 'Gunakan sumber komputer untuk menyahsulit mesej.',
        impact: {
          message: 'Nyahsulit selesai: "KITA TIDAK SENDIRIAN". Anak kapal berasa gelisah tetapi bermotivasi.'
        }
      },
      {
        label: 'Abaikan & Fokus',
        description: 'Kekalkan kesenyapan radio dan fokus pada parameter misi.',
        impact: {
          message: 'Isyarat diabaikan. Fokus misi kekal tinggi.'
        }
      }
    ]
  },
  {
    id: 'thruster-glitch',
    title: 'Gangguan Kawalan Pendorong',
    description: 'Sistem RCS melepaskan tembakan secara berselang-seli, menyebabkan putaran yang tidak dirancang.',
    type: 'malfunction',
    choices: [
      {
        label: 'But Semula Avionik',
        description: 'Lakukan but semula sistem sepenuhnya. Anda akan hilang kawalan selama beberapa saat.',
        impact: {
          message: 'Sistem dibut semula. RCS kembali normal.'
        }
      },
      {
        label: 'Pintasan Manual',
        description: 'Lawan gangguan dengan input kayu manual.',
        impact: {
          fuel: -100,
          message: 'Gangguan stabil, tetapi dengan kos sedikit bahan api RCS.'
        }
      }
    ]
  }
];
