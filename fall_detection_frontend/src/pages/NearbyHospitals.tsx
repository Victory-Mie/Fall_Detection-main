import React, { useEffect, useRef, useState } from "react";
import { Card, List, Spin, Typography, message } from "antd";
const { Title } = Typography;

const NearbyHospitals = () => {
  const mapRef = useRef(null);
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [hospitals, setHospitals] = useState([]);
  const [searchText, setSearchText] = useState("");
  const mapInstance = useRef(null);

  // New Google Maps API v3.49+ async/await pattern
  useEffect(() => {
    let map;
    let center;
    let autocomplete;

    async function initMap() {
      if (!window.google || !mapRef.current) {
        setLoading(false);
        return;
      }
      const { Map } = await window.google.maps.importLibrary("maps");
      center = new window.google.maps.LatLng(39.915, 116.404); // Default: Beijing
      map = new Map(mapRef.current, {
        center: center,
        zoom: 15,
        mapId: "DEMO_MAP_ID",
      });
      mapInstance.current = map;

      // Geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            center = new window.google.maps.LatLng(
              position.coords.latitude,
              position.coords.longitude
            );
            map.setCenter(center);
            searchNearby(center, map);
          },
          () => {
            message.warning("Geolocation failed, using default location.");
            searchNearby(center, map);
          }
        );
      } else {
        searchNearby(center, map);
      }

      // Place Autocomplete
      const { Autocomplete } = await window.google.maps.importLibrary("places");
      autocomplete = new Autocomplete(inputRef.current, {
        fields: ["geometry", "formatted_address"],
      });
      autocomplete.addListener("place_changed", async () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) {
          message.error("No details available for input: '" + place.name + "'");
          setLoading(false);
          return;
        }
        setSearchText(place.formatted_address);
        map.setCenter(place.geometry.location);
        await searchNearby(place.geometry.location, map);
      });

      // 在initMap()内部
      const controlDiv = document.createElement("div");
      controlDiv.style.margin = "10px";

      const controlUI = document.createElement("button");
      controlUI.style.backgroundColor = "#fff";
      controlUI.style.border = "5px solid #fff";
      controlUI.style.borderRadius = "100px";
      controlUI.style.boxShadow = "0 2px 6px rgba(0,0,0,.3)";
      controlUI.style.cursor = "pointer";
      controlUI.style.marginRight = "0px";
      controlUI.style.padding = "8px";
      controlUI.title = "Click to locate your position";
      controlUI.innerText = "📍";
      controlDiv.appendChild(controlUI);

      controlUI.addEventListener("click", () => {
        if (navigator.geolocation) {
          setLoading(true);
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const userPos = new window.google.maps.LatLng(
                position.coords.latitude,
                position.coords.longitude
              );
              map.setCenter(userPos);
              searchNearby(userPos, map);
            },
            () => {
              message.warning("Geolocation failed.");
              setLoading(false);
            }
          );
        } else {
          message.warning("Geolocation not supported.");
        }
      });

      // 将控件添加到地图右下角
      map.controls[window.google.maps.ControlPosition.RIGHT_BOTTOM].push(
        controlDiv
      );
    }

    async function searchNearby(center, map) {
      setLoading(true);
      try {
        const { Place, SearchNearbyRankPreference } =
          await window.google.maps.importLibrary("places");
        const { AdvancedMarkerElement } =
          await window.google.maps.importLibrary("marker");
        const request = {
          fields: [
            "displayName",
            "location",
            "businessStatus",
            "formattedAddress",
            "types",
          ],
          locationRestriction: {
            center: center,
            radius: 5000,
          },
          includedPrimaryTypes: ["hospital"],
          maxResultCount: 10,
          rankPreference: SearchNearbyRankPreference.POPULARITY,
          language: "en-US",
          region: "us",
        };
        // @ts-ignore
        const { places } = await Place.searchNearby(request);
        if (places && places.length) {
          setHospitals(places);
          // Optionally add markers
          const { LatLngBounds } = await window.google.maps.importLibrary(
            "core"
          );
          const bounds = new LatLngBounds();
          places.forEach((place) => {
            new AdvancedMarkerElement({
              map,
              position: place.location,
              title: place.displayName?.text || place.displayName,
            });
            bounds.extend(place.location);
          });
          map.fitBounds(bounds);
        } else {
          setHospitals([]);
          message.error("No nearby hospitals found.");
        }
      } catch (e) {
        setHospitals([]);
        message.error("Nearby search failed.");
        console.error(e);
      }
      setLoading(false);
    }

    initMap();
  }, []);

  // Manual search by address
  const handleSearch = async () => {
    if (!searchText) return;
    if (!window.google || !mapRef.current) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { Geocoder } = await window.google.maps.importLibrary("geocoding");
    const geocoder = new Geocoder();
    geocoder.geocode({ address: searchText }, async (results, status) => {
      if (status === "OK" && results[0]) {
        const location = results[0].geometry.location;
        mapInstance.current.setCenter(location);
        await searchNearby(location, mapInstance.current);
      } else {
        message.error("Could not find the location. Status: " + status);
        setLoading(false);
      }
    });
  };

  // searchNearby function must be in scope for handleSearch
  async function searchNearby(center, map) {
    setLoading(true);
    try {
      const { Place, SearchNearbyRankPreference } =
        await window.google.maps.importLibrary("places");
      const { AdvancedMarkerElement } = await window.google.maps.importLibrary(
        "marker"
      );
      const request = {
        fields: [
          "displayName",
          "location",
          "businessStatus",
          "formattedAddress",
          "types",
        ],
        locationRestriction: {
          center: center,
          radius: 5000,
        },
        includedPrimaryTypes: ["hospital"],
        maxResultCount: 10,
        rankPreference: SearchNearbyRankPreference.POPULARITY,
        language: "en-US",
        region: "us",
      };
      // @ts-ignore
      const { places } = await Place.searchNearby(request);
      if (places && places.length) {
        setHospitals(places);
        // Optionally add markers
        const { LatLngBounds } = await window.google.maps.importLibrary("core");
        const bounds = new LatLngBounds();
        places.forEach((place) => {
          new AdvancedMarkerElement({
            map,
            position: place.location,
            title: place.displayName?.text || place.displayName,
          });
          bounds.extend(place.location);
        });
        map.fitBounds(bounds);
      } else {
        setHospitals([]);
        message.error("No nearby hospitals found.");
      }
    } catch (e) {
      setHospitals([]);
      message.error("Nearby search failed.");
      console.error(e);
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <Title level={2}>Nearby Hospitals</Title>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <input
            ref={inputRef}
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Enter a place"
            style={{
              flex: 1,
              maxWidth: 500,
              padding: "8px 12px",
              border: "1px solid #d9d9d9",
              borderRadius: "6px",
              fontSize: "14px",
              outline: "none",
            }}
            id="google-autocomplete"
          />
          <button
            onClick={handleSearch}
            style={{
              padding: "8px 16px",
              backgroundColor: "#1890ff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Search
          </button>
        </div>
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
            id="google-map"
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
                      title={item.displayName?.text || item.displayName}
                      description={
                        <>
                          <div>
                            {item.formattedAddress ||
                              (item.location &&
                                `${item.location.lat}, ${item.location.lng}`)}
                          </div>
                          {item.businessStatus && (
                            <div>Status: {item.businessStatus}</div>
                          )}
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
