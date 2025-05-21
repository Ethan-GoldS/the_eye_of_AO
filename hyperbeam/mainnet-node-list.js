// mainnet-node-list.js

const mainnetNodes = [
    {
        hb: "https://tee-1.forward.computer",
        cu: "--",
        proxy: false
    },
    {
        hb: "https://tee-2.forward.computer",
        cu: "--",
        proxy: false
    },
    {
        hb: "https://tee-3.forward.computer",
        cu: "--",
        proxy: false
    },
    {
        hb: "https://tee-4.forward.computer",
        cu: "--",
        proxy: false
    },
    {
        hb: "https://router-1.forward.computer",
        cu: "--",
        proxy: false
    },
    {
      hb: "https://hb.perplex.finance/",
      cu: "https://cu.perplex.finance/",
      proxy: false
    },
    {
        hb: "https://hb.marshal.ao/",
        cu: "--",
        proxy: false
    },
    {
      hb: "https://arweave.nyc/",
      cu: "--",
      proxy: false
    },
    {
      hb: "http://girls.onthewifi.com/",
      cu: "--",
      proxy: true
    },
    {
      hb: "https://hb.ao.p10node.com/",
      cu: "https://cu.ao.p10node.com/",
      proxy: false
    },
    {
      hb: "https://hb.randao.net/",
      cu: "--",
      proxy: false
    },
    {
      hb: "https://dai-gnostics.com/",
      cu: "http://dai-gnostics.com:6363/",
      proxy: true
    },
    {
      hb: "https://hb.arweave.asia/",
      cu: "https://cu.arweave.asia/",
      proxy: false
    },
    {
      hb: "https://hb.arhub.asia/",
      cu: "https://cu.arhub.asia/",
      proxy: false
    },
    {
      hb: "https://ao1.avx.im/",
      cu: "--",
      proxy: false
    },
    {
      hb: "https://beam01.smartlabel.media/",
      cu: "https://cu01.smartlabel.media/",
      proxy: false
    },
      {
        hb: "https://vixanator-hb.ngrok.io/",
        cu: "https://vixanator-cu.ngrok.io/",
        proxy: false
      },
    {
      hb: "http://185.177.124.64:10000/",
      cu: "--",
      proxy: true
    },
    {
      hb: "http://38.58.182.4:10000/",
      cu: "--",
      proxy: true
    },
    {
      hb: "http://43.160.203.36:10000/",
      cu: "http://43.160.203.36:6363/",
      proxy: true
    },
    {
      hb: "http://84.247.181.43:10000/",
      cu: "--",
      proxy: true
    },
    {
      hb: "http://161.97.111.21:10000/",
      cu: "http://161.97.111.21:6363/",
      proxy: true
    },
    {
      hb: "http://78.46.96.89:10000/",
      cu: "http://78.46.96.89:6363/",
      proxy: true
    },
    {
      hb: "http://94.136.191.183:10000/",
      cu: "--",
      proxy: true
    },
    {
      hb: "http://173.249.55.161/",
      cu: "--",
      proxy: true
    },
    {
      hb: "http://65.21.104.103:10001/",
      cu: "--",
      proxy: true
    },
    {
      hb: "http://149.50.96.91:8734/",
      cu: "--",
      proxy: true
    },
    {
      hb: "http://194.238.25.30:8734/",
      cu: "--",
      proxy: true
    },
    {
      hb: "http://65.109.105.164:10000/",
      cu: "--",
      proxy: true
    },
    {
      hb: "http://159.69.187.12:10000/",
      cu: "--",
      proxy: true
    },
    {
      hb: "http://84.247.138.105:10000/",
      cu: "--",
      proxy: true
    },
    {
      hb: "http://80.190.80.172:8734/",
      cu: "--",
      proxy: true
    },
    {
      hb: "http://118.31.171.74:10000/",
      cu: "http://118.31.171.74:6363/",
      proxy: true
    },
    {
      hb: "http://89.58.48.48:10000/",
      cu: "--",
      proxy: true
    },
    {
      hb: "http://62.72.42.125/",
      cu: "--",
      proxy: true
    },
    {
      hb: "http://65.109.27.148:10000/",
      cu: "--",
      proxy: true
    },
    {
      hb: "http://195.179.228.91:10001/",
      cu: "http://195.179.228.91:6363/",
      proxy: true
    },
    {
      hb: "http://62.171.187.29:10001/",
      cu: "http://62.171.187.29:6363/",
      proxy: true
    },
    {
      hb: "http://65.108.201.218:8734/",
      cu: "https://adn79.pro/ao/cu",
      proxy: true
    },
    {
      hb: "http://89.187.28.192:10001/",
      cu: "http://89.187.28.192:6363/",
      proxy: true
    },
    {
      hb: "http://152.53.87.198:9001/",
      cu: "http://152.53.87.198:9002/",
      proxy: true
    },
    {
      hb: "http://47.128.240.209:10001/",
      cu: "http://47.128.240.209:6363/",
      proxy: true
    },
    {
      hb: "http://60.176.96.48:10000/",
      cu: "http://60.176.96.48:6363/",
      proxy: true
    },
    {
      hb: "http://89.117.60.148:10000/",
      cu: "http://89.117.60.148:6363/",
      proxy: true
    },
    {
      hb: "http://37.60.238.239:10000/",
      cu: "http://37.60.238.239:6363/",
      proxy: true
    },
    {
      hb: "http://95.217.3.46:10000/",
      cu: "http://95.217.3.46:6363/",
      proxy: true
    },
    {
      hb: "http://65.108.255.207:10000/",
      cu: "http://65.108.255.207:6363/",
      proxy: true
    },
    {
      hb: "http://95.217.134.254:10000/",
      cu: "http://95.217.134.254:6363/",
      proxy: true
    },
    {
      hb: "http://37.27.91.213:10000/",
      cu: "http://37.27.91.213:6363/",
      proxy: true
    },
    {
      hb: "http://144.126.129.12:10000/",
      cu: "http://144.126.129.12:6365/",
      proxy: true
    },
    {
      hb: "http://95.216.248.117:10000/",
      cu: "http://95.216.248.117:6363/",
      proxy: true
    },
    {
      hb: "http://8.148.68.114:10000/",
      cu: "http://8.148.68.114:6363/",
      proxy: true
    },
    {
      hb: "http://146.190.54.24:10001/",
      cu: "http://146.190.54.24:6363/",
      proxy: true
    },
    {
      hb: "http://147.185.40.122:20047/",
      cu: "http://147.185.40.122:20045/",
      proxy: true
    },
    {
      hb: "http://161.97.167.146:10000/",
      cu: "--",
      proxy: true
    },
    {
      hb: "http://65.109.91.146:10000/",
      cu: "--",
      proxy: true
    },
    {
      hb: "http://167.114.172.27:10001/",
      cu: "http://167.114.172.27:6363/",
      proxy: true
    },
    {
      hb: "http://8.148.230.133:10000/",
      cu: "http://8.148.230.133:6363/",
      proxy: true
    },
    {
      hb: "http://27.72.31.207:10000/",
      cu: "--",
      proxy: true
    },
    {
      hb: "http://45.76.89.152:10000/",
      cu: "http://45.76.89.152:6363/",
      proxy: true
    },
    {
      hb: "http://121.43.32.111:10000/",
      cu: "http://121.43.32.111:6363/",
      proxy: true
    },
    {
        hb: "http://207.180.227.138:10000/",
        cu: "http://207.180.227.138:6363/",
        proxy: true
      },
      {
        hb: "http://185.174.164.162:10000/",
        cu: "http://185.174.164.162:6363/",
        proxy: true
      },
      {
        hb: "http://95.111.252.179:10000/",
        cu: "http://95.111.252.179:6363/",
        proxy: true
      },
      {
        hb: "http://173.212.194.71:10000/",
        cu: "http://173.212.194.71:6363/",
        proxy: true
      },
      {
        hb: "http://202.61.201.187:10001/",
        cu: "http://202.61.201.187:6363/",
        proxy: true
      },
      {
        hb: "http://118.178.135.71:10000/",
        cu: "http://118.178.135.71:6363/",
        proxy: true
      },
      {
        hb: "http://213.160.68.7:10001/",
        cu: "--",
        proxy: true
      },
      {
        hb: "http://5.189.147.76:10000/",
        cu: "http://5.189.147.76:6363/",
        proxy: true
      },
      {
        hb: "http://38.242.230.205:10000/",
        cu: "http://38.242.230.205:6363/",
        proxy: true
      },
      {
        hb: "http://173.249.11.37:10000/",
        cu: "http://173.249.11.37:6363/",
        proxy: true
      },
      {
        hb: "http://8.134.178.40:10000/",
        cu: "http://8.134.178.40:6363/",
        proxy: true
      },
      {
        hb: "http://194.163.188.221:10000/",
        cu: "http://194.163.188.221:6363/",
        proxy: true
      },
      {
        hb: "http://185.218.126.59:10000/",
        cu: "http://185.218.126.59:6363/",
        proxy: true
      },
      {
        hb: "http://149.102.138.138:10000/",
        cu: "--",
        proxy: true
      },
      {
        hb: "http://83.171.248.176:10000/",
        cu: "http://83.171.248.176:6363/",
        proxy: true
      },
      {
        hb: "http://95.111.238.178:10000/",
        cu: "http://95.111.238.178:6363/",
        proxy: true
      }
  ];
  
  export { mainnetNodes };
  