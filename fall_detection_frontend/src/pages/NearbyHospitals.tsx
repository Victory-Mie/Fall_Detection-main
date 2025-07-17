import { useEffect, useRef, useState } from "react";
import { List, Typography, message, Card, Spin, Input } from "antd";
const { Title } = Typography;
const { Search } = Input;

// 声明AMap类型（如未全局声明）
declare global {
  interface Window {
    AMap: any;
  }
}

const NearbyHospitals = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [center, setCenter] = useState<[number, number]>([
    116.397428, 39.90923,
  ]); // 默认北京
  const [searchText, setSearchText] = useState("");
  const mapInstance = useRef<any>(null);
  const autoCompleteInstance = useRef<any>(null);

  // 页面加载后自动定位并搜索附近医院
  useEffect(() => {
    if (!window.AMap || !mapRef.current) return;

    const map = new window.AMap.Map(mapRef.current, {
      zoom: 15,
      // center,
      lang: "en",
    });
    mapInstance.current = map;

    // 初始化输入提示
    window.AMap.plugin(["AMap.AutoComplete"], function () {
      autoCompleteInstance.current = new window.AMap.AutoComplete({
        input: "searchInput", // 使用ID而不是ref
      });

      // 监听选择事件
      autoCompleteInstance.current.on("select", function (e: any) {
        console.log("选择了:", e.poi);
        setSearchText(e.poi.name);
        // 自动搜索
        handleSearch(e.poi.name);
      });
    });

    // 定位
    window.AMap.plugin("AMap.Geolocation", function () {
      const geolocation = new window.AMap.Geolocation({
        enableHighAccuracy: true, // 是否使用高精度定位，默认：true
        timeout: 10000, // 设置定位超时时间，默认：无穷大
        offset: [10, 20], // 定位按钮的停靠位置的偏移量
        zoomToAccuracy: true, //  定位成功后调整地图视野范围使定位位置及精度范围视野内可见，默认：false
        position: "RB", //  定位按钮的排放位置,  RB表示右下
      
      });

      map.addControl(geolocation);
      console.log("geolocation", geolocation);
      geolocation.getCurrentPosition(function (status: string, result: any) {
        if (status === "complete") {
          const lnglat = [result.position.lng, result.position.lat] as [
            number,
            number
          ];
          console.log("定位成功:", lnglat);
          setCenter(lnglat);
          map.setCenter(lnglat);
          searchNearby(map, lnglat);
        } else {
          message.warning("Location failed, using default position");
          // searchNearby(map, center);
        }
      });
    });
    // eslint-disable-next-line
  }, []);

  // 搜索附近医院
  const searchNearby = (map: any, lnglat: [number, number]) => {
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
        function (status: string, result: any) {
          setLoading(false);
          const pois = result?.poiList?.pois || [];
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

  // 搜索指定地名附近的医院
  const handleSearch = (searchValue?: string) => {
    const valueToSearch = searchValue || searchText;
    if (!valueToSearch) return;

    if (!window.AMap || !mapRef.current) {
      message.error("AMap API not available");
      return;
    }

    message.info("Searching for hospitals near: " + valueToSearch);

    window.AMap.plugin(["AMap.Geocoder"], function () {
      const geocoder = new window.AMap.Geocoder();
      geocoder.getLocation(
        valueToSearch,
        function (status: string, result: any) {
          if (
            status === "complete" &&
            result.geocodes &&
            result.geocodes.length > 0
          ) {
            const location = result.geocodes[0].location;
            const lnglat: [number, number] = [location.lng, location.lat];
            setCenter(lnglat);
            if (mapInstance.current) mapInstance.current.setCenter(lnglat);
            searchNearby(mapInstance.current, lnglat);
          } else {
            message.error("Failed to locate the place");
          }
        }
      );
    });
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <Title level={2}>Hospital Search</Title>
      <Card style={{ marginBottom: 16 }}>
        <Search
          id="searchInput"
          placeholder="Input the place name"
          onSearch={handleSearch}
          style={{ maxWidth: 500 }}
          enterButton
        />
      </Card>
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
                renderItem={(item: any) => (
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
