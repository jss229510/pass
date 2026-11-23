let loadingPromise = null;

// 카카오 지도 SDK(services 포함)를 한 번만 불러오고, 준비되면 window.kakao를 돌려줍니다.
export function loadKakaoMaps() {
  if (window.kakao?.maps) return new Promise((resolve) => window.kakao.maps.load(() => resolve(window.kakao)));

  const appKey = import.meta.env.VITE_KAKAO_MAP_KEY;
  if (!appKey) return Promise.reject(new Error("지도 키가 설정되지 않았습니다."));

  if (!loadingPromise) {
    loadingPromise = new Promise((resolve, reject) => {
      const onLoad = () => window.kakao.maps.load(() => resolve(window.kakao));
      const onError = () => reject(new Error("지도를 불러오지 못했습니다. 등록한 도메인과 지도 키를 확인해 주세요."));
      let script = document.querySelector("script[data-kakao-maps-sdk]");
      if (!script) {
        script = document.createElement("script");
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
        script.async = true;
        script.dataset.kakaoMapsSdk = "true";
        document.head.appendChild(script);
      }
      script.addEventListener("load", onLoad, { once: true });
      script.addEventListener("error", onError, { once: true });
    }).catch((error) => {
      loadingPromise = null;
      throw error;
    });
  }
  return loadingPromise;
}
