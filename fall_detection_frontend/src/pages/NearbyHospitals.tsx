import { useEffect, useRef, useState } from "react";
import {
  Input,
  List,
  Typography,
  message,
  Card,
  Spin,
  AutoComplete,
} from "antd";
const { Title } = Typography;

// 高德地图JS API需在public/index.html引入
// <script src="https://webapi.amap.com/maps?v=2.0&key=你的JSAPI_KEY"></script>

// 声明AMap类型（如未全局声明）
declare global {
  interface Window {
    AMap: any;
  }
}

const NearbyHospitals = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [hospitals, setHospitals] = useState<unknown[]>([]);
  const [center, setCenter] = useState<[number, number]>([
    116.397428, 39.90923,
  ]); // 默认北京
  const [searchText, setSearchText] = useState("");
  const [searching, setSearching] = useState(false);
  const [options, setOptions] = useState<{ value: string }[]>([]);
  // 移除与语言切换相关的state和ref

  // 初始化地图和定位
  useEffect(() => {
    if (!window.AMap || !mapRef.current) return;
    const map = new window.AMap.Map(mapRef.current, {
      zoom: 15,
      center,
      lang: 'en', // 只用英文
    });
    // 定位
    window.AMap.plugin("AMap.Geolocation", function () {
      const geolocation = new window.AMap.Geolocation({
        enableHighAccuracy: true,
        timeout: 10000,
      });
      map.addControl(geolocation);
      geolocation.getCurrentPosition(function (status: string, result: unknown) {
        if (status === "complete") {
          const r = result as { position: { lng: number; lat: number } };
          const lnglat = [r.position.lng, r.position.lat] as [number, number];
          setCenter(lnglat);
          map.setCenter(lnglat);
          searchNearby(map, lnglat);
        } else {
          message.warning("Location failed, using default position");
          searchNearby(map, center);
        }
      });
    });
    // eslint-disable-next-line
  }, []);

  // 搜索附近医院
  const searchNearby = (map: unknown, lnglat: [number, number]) => {
    setLoading(true);
    window.AMap.plugin(["AMap.PlaceSearch"], function () {
      const placeSearch = new window.AMap.PlaceSearch({
        type: "Hospital",
        pageSize: 10,
        pageIndex: 1,
        city: "auto",
        map: map,
      });
      placeSearch.searchNearBy(
        "Hospital",
        lnglat,
        5000,
        function (status: string, result: unknown) {
          setLoading(false);
          console.log('PlaceSearch result (searchNearby):', status, result); // 调试输出
          const pois = (result as any)?.poiList?.pois || (result as any)?.data?.poiList?.pois || [];
          if (pois.length > 0) {
            setHospitals(pois);
          } else {
            setHospitals([]);
            message.error("No nearby hospitals found");
          }
        }
      );
    });
  };

  // 搜索其他地区医院
  const handleSearch = () => {
    if (!searchText) return;
    setSearching(true);
    window.AMap.plugin(["AMap.PlaceSearch"], function () {
      const map = new window.AMap.Map(mapRef.current, {
        zoom: 13,
        lang: 'en', // 只用英文
      });
      const placeSearch = new window.AMap.PlaceSearch({
        type: "Hospital",
        pageSize: 10,
        pageIndex: 1,
        city: "auto",
        map: map,
      });
      placeSearch.search(
        searchText,
        function (status: string, result: unknown) {
          setSearching(false);
          console.log('PlaceSearch result (handleSearch):', status, result); // 调试输出
          const pois = (result as any)?.poiList?.pois || (result as any)?.data?.poiList?.pois || [];
          if (pois.length > 0) {
            setHospitals(pois);
            if (pois[0]) {
              const lnglat = [
                pois[0].location.lng,
                pois[0].location.lat,
              ] as [number, number];
              setCenter(lnglat);
              map.setCenter(lnglat);
            }
          } else if ((result as any).info === 'TIP_CITIES' && (result as any).cityList && (result as any).cityList.length > 0) {
            message.info(`Please specify a more precise location or select a city.`);
            setHospitals([]);
          } else {
            setHospitals([]);
            message.error("No hospitals found in this area");
          }
        }
      );
    });
  };

  // 智能联想输入
  const handleAutoComplete = (value: string) => {
    setSearchText(value);
    if (!value) {
      setOptions([]);
      return;
    }
    if (window.AMap) {
      const auto = new window.AMap.Autocomplete();
      auto.search(value, (status: string, result: any) => {
        if (status === "complete" && result.tips) {
          setOptions(
            result.tips
              .filter((tip: any) => !!tip.name)
              .map((tip: any) => ({ value: tip.name }))
          );
        }
      });
    }
  };

  // 用户选择联想项后，自动填充输入框
  const handleSelect = (value: string) => {
    setSearchText(value);
    // 可选：自动搜索 handleSearch();
  };

  // 切换底图语言
  // const handleLangChange = (e: any) => {
  //   setMapLang(e.target.value);
  //   // 不再调用 mapInstance.current.setLang
  // };

  return (
    <div style={{ minHeight: "100vh" }}>
      <Title level={2}>Hospital Search</Title>
      <Card style={{ marginBottom: 16 }}>
        <AutoComplete
          style={{ maxWidth: 600 }}
          options={options}
          value={searchText}
          onSearch={handleAutoComplete}
          onSelect={handleSelect}
          placeholder="Input the landmark"
        >
          <Input.Search
            enterButton="search"
            onSearch={handleSearch}
            loading={searching}
          />
        </AutoComplete>
      </Card>
      {/* <Radio.Group
        value={mapLang}
        onChange={handleLangChange}
        style={{ marginBottom: 16 }}
      >
        <Radio.Button value="en">English</Radio.Button>
        <Radio.Button value="zh_en">中英对照</Radio.Button>
        <Radio.Button value="zh_cn">中文</Radio.Button>
      </Radio.Group> */}
      <div style={{ display: "flex", gap: 24 }}>
        <div style={{ flex: 1, minWidth: 400, height: 400 }}>
          <div
            ref={mapRef}
            style={{
              width: "100%",
              height: 400,
              borderRadius: 8,
              border: "1px solid #eee",
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 300 }}>
          <Card
            title="Nearby Hospitals"
            style={{ height: 400, overflow: "auto" }}
          >
            {loading ? (
              <Spin />
            ) : (
              <List
                dataSource={hospitals}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.name}
                      description={
                        <>
                          <div>{item.address}</div>
                          {item.tel && <div>Tel: {item.tel}</div>}
                        </>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NearbyHospitals;
