"use client";

import { KeyboardEvent, PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { geoCentroid, geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import worldAtlas from "world-atlas/countries-110m.json";

import { destinationSlug } from "@/lib/destinationSlug";

const countryAliases: Record<string, string[]> = {
  avstraliya: ["Australia"],
  avstriya: ["Austria"],
  bali: ["Indonesia"],
  belgiya: ["Belgium"],
  braziliya: ["Brazil"],
  vietnam: ["Vietnam"],
  germaniya: ["Germany"],
  gartsiya: ["Greece"],
  dominikana: ["Dominican Rep."],
  dubay: ["United Arab Emirates"],
  egipet: ["Egypt"],
  yordaniya: ["Jordan"],
  yaponiya: ["Japan"],
  ispaniya: ["Spain"],
  italiya: ["Italy"],
  kanada: ["Canada"],
  keniya: ["Kenya"],
  kitay: ["China"],
  kipar: ["Cyprus"],
  kuba: ["Cuba"],
  maldivi: ["Maldives"],
  maroko: ["Morocco"],
  meksiko: ["Mexico"],
  norvegiya: ["Norway"],
  oae: ["United Arab Emirates"],
  obedineni_arabski_emirstva: ["United Arab Emirates"],
  portugaliya: ["Portugal"],
  rumaniya: ["Romania"],
  seyshli: ["Seychelles"],
  singapur: ["Singapore"],
  ssha: ["United States of America"],
  tailand: ["Thailand"],
  tunis: ["Tunisia"],
  turtsiya: ["Turkey"],
  ungariya: ["Hungary"],
  frantsiya: ["France"],
  harvatiya: ["Croatia"],
  chernogoriya: ["Montenegro"],
  shveytsariya: ["Switzerland"],
  shri_lanka: ["Sri Lanka"]
};

const bulgarianCountryNames: Record<string, string> = {
  Afghanistan: "Афганистан",
  Albania: "Албания",
  Algeria: "Алжир",
  Angola: "Ангола",
  Argentina: "Аржентина",
  Armenia: "Армения",
  Australia: "Австралия",
  Austria: "Австрия",
  Azerbaijan: "Азербайджан",
  Bahamas: "Бахами",
  Bangladesh: "Бангладеш",
  Belarus: "Беларус",
  Belgium: "Белгия",
  Bolivia: "Боливия",
  Bosnia: "Босна и Херцеговина",
  Botswana: "Ботсвана",
  Brazil: "Бразилия",
  Bulgaria: "България",
  Cambodia: "Камбоджа",
  Cameroon: "Камерун",
  Canada: "Канада",
  Chad: "Чад",
  Chile: "Чили",
  China: "Китай",
  Colombia: "Колумбия",
  "Costa Rica": "Коста Рика",
  Croatia: "Хърватия",
  Cuba: "Куба",
  Cyprus: "Кипър",
  Czechia: "Чехия",
  Denmark: "Дания",
  "Dominican Rep.": "Доминиканска република",
  Ecuador: "Еквадор",
  Egypt: "Египет",
  Estonia: "Естония",
  Ethiopia: "Етиопия",
  Fiji: "Фиджи",
  Finland: "Финландия",
  France: "Франция",
  Georgia: "Грузия",
  Germany: "Германия",
  Ghana: "Гана",
  Greece: "Гърция",
  Greenland: "Гренландия",
  Hungary: "Унгария",
  Iceland: "Исландия",
  India: "Индия",
  Indonesia: "Индонезия",
  Iran: "Иран",
  Iraq: "Ирак",
  Ireland: "Ирландия",
  Israel: "Израел",
  Italy: "Италия",
  Jamaica: "Ямайка",
  Japan: "Япония",
  Jordan: "Йордания",
  Kazakhstan: "Казахстан",
  Kenya: "Кения",
  "Kosovo": "Косово",
  Latvia: "Латвия",
  Lebanon: "Ливан",
  Libya: "Либия",
  Lithuania: "Литва",
  Luxembourg: "Люксембург",
  Madagascar: "Мадагаскар",
  Malaysia: "Малайзия",
  Maldives: "Малдиви",
  Mali: "Мали",
  Malta: "Малта",
  Mexico: "Мексико",
  Moldova: "Молдова",
  Mongolia: "Монголия",
  Montenegro: "Черна гора",
  Morocco: "Мароко",
  Nepal: "Непал",
  Netherlands: "Нидерландия",
  "New Zealand": "Нова Зеландия",
  Nigeria: "Нигерия",
  "North Macedonia": "Северна Македония",
  Norway: "Норвегия",
  Oman: "Оман",
  Pakistan: "Пакистан",
  Panama: "Панама",
  Peru: "Перу",
  Philippines: "Филипини",
  Poland: "Полша",
  Portugal: "Португалия",
  Qatar: "Катар",
  Romania: "Румъния",
  Russia: "Русия",
  Rwanda: "Руанда",
  "Saudi Arabia": "Саудитска Арабия",
  Senegal: "Сенегал",
  Serbia: "Сърбия",
  Seychelles: "Сейшели",
  Singapore: "Сингапур",
  Slovakia: "Словакия",
  Slovenia: "Словения",
  "South Africa": "Южна Африка",
  Spain: "Испания",
  "Sri Lanka": "Шри Ланка",
  Sweden: "Швеция",
  Switzerland: "Швейцария",
  Tanzania: "Танзания",
  Thailand: "Тайланд",
  Tunisia: "Тунис",
  Turkey: "Турция",
  Ukraine: "Украйна",
  "United Arab Emirates": "Обединени арабски емирства",
  "United Kingdom": "Великобритания",
  "United States of America": "САЩ",
  Uruguay: "Уругвай",
  Uzbekistan: "Узбекистан",
  Venezuela: "Венецуела",
  Vietnam: "Виетнам",
  Yemen: "Йемен"
};

const numericRegionCodes: Record<string, string> = {
  "004": "AF", "008": "AL", "010": "AQ", "012": "DZ", "024": "AO", "032": "AR", "036": "AU", "040": "AT",
  "044": "BS", "050": "BD", "051": "AM", "056": "BE", "064": "BT", "068": "BO", "070": "BA", "072": "BW",
  "076": "BR", "084": "BZ", "090": "SB", "096": "BN", "100": "BG", "104": "MM", "108": "BI", "116": "KH",
  "120": "CM", "124": "CA", "140": "CF", "144": "LK", "148": "TD", "152": "CL", "156": "CN", "158": "TW",
  "170": "CO", "178": "CG", "180": "CD", "188": "CR", "191": "HR", "192": "CU", "196": "CY", "203": "CZ",
  "204": "BJ", "208": "DK", "214": "DO", "218": "EC", "222": "SV", "226": "GQ", "231": "ET", "232": "ER",
  "233": "EE", "238": "FK", "242": "FJ", "246": "FI", "250": "FR", "260": "TF", "262": "DJ", "266": "GA",
  "268": "GE", "270": "GM", "275": "PS", "276": "DE", "288": "GH", "300": "GR", "304": "GL", "320": "GT",
  "324": "GN", "328": "GY", "332": "HT", "340": "HN", "348": "HU", "352": "IS", "356": "IN", "360": "ID",
  "364": "IR", "368": "IQ", "372": "IE", "376": "IL", "380": "IT", "384": "CI", "388": "JM", "392": "JP",
  "398": "KZ", "400": "JO", "404": "KE", "408": "KP", "410": "KR", "414": "KW", "417": "KG", "418": "LA",
  "422": "LB", "426": "LS", "428": "LV", "430": "LR", "434": "LY", "440": "LT", "442": "LU", "450": "MG",
  "454": "MW", "458": "MY", "466": "ML", "478": "MR", "484": "MX", "496": "MN", "498": "MD", "499": "ME",
  "504": "MA", "508": "MZ", "512": "OM", "516": "NA", "524": "NP", "528": "NL", "540": "NC", "548": "VU",
  "554": "NZ", "558": "NI", "562": "NE", "566": "NG", "578": "NO", "586": "PK", "591": "PA", "598": "PG",
  "600": "PY", "604": "PE", "608": "PH", "616": "PL", "620": "PT", "630": "PR", "634": "QA", "642": "RO",
  "643": "RU", "646": "RW", "682": "SA", "686": "SN", "688": "RS", "694": "SL", "703": "SK", "704": "VN",
  "705": "SI", "706": "SO", "710": "ZA", "716": "ZW", "724": "ES", "728": "SS", "729": "SD", "732": "EH",
  "740": "SR", "748": "SZ", "752": "SE", "756": "CH", "760": "SY", "762": "TJ", "764": "TH", "768": "TG",
  "780": "TT", "788": "TN", "792": "TR", "795": "TM", "800": "UG", "804": "UA", "807": "MK", "818": "EG",
  "826": "GB", "834": "TZ", "840": "US", "854": "BF", "858": "UY", "860": "UZ", "862": "VE", "887": "YE",
  "894": "ZM"
};

const countryNameOverrides: Record<string, string> = {
  Kosovo: "Косово",
  "N. Cyprus": "Северен Кипър",
  Somaliland: "Сомалиленд"
};

const bulgarianRegionNames = new Intl.DisplayNames(["bg"], { type: "region" });

type CountryFeature = {
  id?: string;
  properties?: {
    name?: string;
  };
};

type GlobeDestination = {
  country: string;
  slug: string;
  offerCount: number;
};

type HoveredCountryInfo = {
  country: string;
  offerCount: number;
};

const world = worldAtlas as unknown as {
  objects: {
    countries: unknown;
  };
};

const countryCollection = feature(world as never, world.objects.countries as never) as unknown as {
  features: CountryFeature[];
};

const countries = countryCollection.features;

function normalizeCountryName(value: string) {
  return value.trim().toLowerCase().replace(/^the\s+/, "");
}

function findCountry(country: string) {
  const slug = destinationSlug(country);
  const aliases = countryAliases[slug] ?? [country];
  const normalizedAliases = new Set(aliases.map(normalizeCountryName));

  return countries.find((item) => {
    const name = item.properties?.name;
    if (!name) {
      return false;
    }

    return normalizedAliases.has(normalizeCountryName(name)) || destinationSlug(name) === slug;
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getBulgarianCountryName(country: CountryFeature | undefined) {
  const countryName = country?.properties?.name;
  if (!countryName) {
    return "Държава";
  }

  const regionCode = country?.id ? numericRegionCodes[country.id] : undefined;
  if (regionCode) {
    return bulgarianRegionNames.of(regionCode) || countryName;
  }

  if (countryNameOverrides[countryName]) {
    return countryNameOverrides[countryName];
  }

  return bulgarianCountryNames[countryName] ?? countryName;
}

function offerCountLabel(count: number) {
  return count === 1 ? "1 оферта" : `${count} оферти`;
}

export function DestinationGlobe({
  country,
  destinations = [],
  highlightSelectedCountry = true,
  initialZoom = 1.34,
  maxZoom = 3.25
}: {
  country: string;
  destinations?: GlobeDestination[];
  highlightSelectedCountry?: boolean;
  initialZoom?: number;
  maxZoom?: number;
}) {
  const [hoveredCountryId, setHoveredCountryId] = useState<string | undefined>();
  const [hoveredCountryInfo, setHoveredCountryInfo] = useState<HoveredCountryInfo | undefined>();
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const selectedCountry = highlightSelectedCountry && country.trim() ? findCountry(country) : undefined;
  const center = selectedCountry ? geoCentroid(selectedCountry as never) : [22, 36];
  const initialRotation = useMemo<[number, number]>(() => [-center[0], -center[1]], [center[0], center[1]]);
  const [rotation, setRotation] = useState<[number, number]>(initialRotation);
  const [zoom, setZoom] = useState(initialZoom);
  const rotationRef = useRef<[number, number]>(initialRotation);
  const zoomRef = useRef(initialZoom);
  const globeRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragStart = useRef<{ x: number; y: number; rotation: [number, number]; moved: boolean } | null>(null);
  const draggedLink = useRef(false);

  useEffect(() => {
    setRotation(initialRotation);
    rotationRef.current = initialRotation;
    setZoom(initialZoom);
    zoomRef.current = initialZoom;
  }, [initialRotation, initialZoom]);

  useEffect(() => {
    const globeElement = globeRef.current;
    if (!globeElement) {
      return;
    }

    function handleNativeWheel(event: WheelEvent) {
      event.preventDefault();
      const nextZoom = clamp(zoomRef.current - event.deltaY * 0.00145, 1, maxZoom);
      zoomRef.current = nextZoom;
      setZoom(nextZoom);
    }

    globeElement.addEventListener("wheel", handleNativeWheel, { passive: false });

    return () => {
      globeElement.removeEventListener("wheel", handleNativeWheel);
    };
  }, []);

  useEffect(() => {
    let animationFrame = 0;
    let previousTime = performance.now();

    function tick(currentTime: number) {
      const elapsed = currentTime - previousTime;
      previousTime = currentTime;

      if (!dragStart.current) {
        const nextRotation: [number, number] = [rotationRef.current[0] + elapsed * 0.0026, rotationRef.current[1]];
        rotationRef.current = nextRotation;
        setRotation(nextRotation);
      }

      animationFrame = requestAnimationFrame(tick);
    }

    const startTimer = window.setTimeout(() => {
      previousTime = performance.now();
      animationFrame = requestAnimationFrame(tick);
    }, 900);

    return () => {
      window.clearTimeout(startTimer);
      cancelAnimationFrame(animationFrame);
    };
  }, [initialRotation]);

  const destinationsByCountryId = useMemo(() => {
    const items = new Map<string, GlobeDestination>();

    destinations.forEach((destination) => {
      const geoCountry = findCountry(destination.country);
      if (geoCountry?.id) {
        items.set(geoCountry.id, destination);
      }
    });

    return items;
  }, [destinations]);

  const hoveredDestination = hoveredCountryId ? destinationsByCountryId.get(hoveredCountryId) : undefined;
  const tooltipInfo = hoveredCountryInfo
    ? {
        country: hoveredCountryInfo.country,
        offerCount: hoveredDestination?.offerCount ?? hoveredCountryInfo.offerCount
      }
    : undefined;
  const projection = geoOrthographic()
    .rotate([rotation[0], rotation[1]])
    .fitExtent(
      [
        [14 - 36 * (zoom - 1), 14 - 36 * (zoom - 1)],
        [306 + 36 * (zoom - 1), 306 + 36 * (zoom - 1)]
      ],
      { type: "Sphere" }
    )
    .clipAngle(90);
  const path = geoPath(projection);
  const spherePath = path({ type: "Sphere" });
  const graticulePath = path(geoGraticule10());
  const selectedCountryPath = selectedCountry ? path(selectedCountry as never) : null;
  const selectedPoint = selectedCountryPath && selectedCountry ? projection(geoCentroid(selectedCountry as never) as [number, number]) : null;

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    setHoveredCountryId(undefined);
    setHoveredCountryInfo(undefined);
    dragStart.current = {
      moved: false,
      rotation: rotationRef.current,
      x: event.clientX,
      y: event.clientY
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function updateTooltipPosition(event: PointerEvent<SVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) {
      setTooltipPosition({ x: 0, y: 0 });
      return;
    }

    setTooltipPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const start = dragStart.current;
    updateTooltipPosition(event);
    if (!start) {
      return;
    }

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      start.moved = true;
    }

    const nextRotation: [number, number] = [start.rotation[0] + deltaX * 0.28, clamp(start.rotation[1] - deltaY * 0.22, -72, 72)];
    rotationRef.current = nextRotation;
    setRotation(nextRotation);
  }

  function handlePointerEnd(event: PointerEvent<SVGSVGElement>) {
    if (dragStart.current?.moved) {
      draggedLink.current = true;
      window.setTimeout(() => {
        draggedLink.current = false;
      }, 0);
    }

    dragStart.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function openDestination(destination: GlobeDestination) {
    window.location.href = `/destinations/${destination.slug}`;
  }

  function handleDestinationKeyDown(event: KeyboardEvent<SVGGElement>, destination: GlobeDestination) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    openDestination(destination);
  }

  return (
    <div className="destination-globe" ref={globeRef}>
      <div className="destination-globe-sphere">
        <svg
          className="real-destination-globe"
          ref={svgRef}
          onPointerCancel={handlePointerEnd}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          role="img"
          viewBox="0 0 320 320"
          aria-label={`Карта на ${country}`}
        >
          <defs>
            <radialGradient id="real-globe-surface" cx="34%" cy="24%" r="72%">
              <stop offset="0%" stopColor="rgba(255,253,248,0.38)" />
              <stop offset="54%" stopColor="rgba(210,199,181,0.22)" />
              <stop offset="100%" stopColor="rgba(42,38,33,0.24)" />
            </radialGradient>
          </defs>
          {spherePath ? <path className="real-globe-sphere" d={spherePath} /> : null}
          {graticulePath ? <path className="real-globe-graticule" d={graticulePath} /> : null}
          <g className="real-globe-land">
            {countries.map((item) => {
              const countryPath = path(item as never);
              if (!countryPath) {
                return null;
              }

              const isSelected = selectedCountry ? (selectedCountry.id ? selectedCountry.id === item.id : selectedCountry === item) : false;
              const linkedDestination = item.id ? destinationsByCountryId.get(item.id) : undefined;
              const className = [
                "real-globe-country",
                isSelected ? "is-selected" : "",
                linkedDestination ? "is-available" : "",
                hoveredCountryId === item.id && !isSelected ? "is-hovered" : ""
              ]
                .filter(Boolean)
                .join(" ");
              const countryShape = (
                <path
                  className={className}
                  d={countryPath}
                  onBlur={() => setHoveredCountryId(undefined)}
                  onFocus={() => setHoveredCountryId(item.id)}
                  onPointerEnter={(event) => {
                    if (!dragStart.current) {
                      updateTooltipPosition(event);
                      setHoveredCountryId(item.id);
                      setHoveredCountryInfo({
                        country: linkedDestination?.country || getBulgarianCountryName(item),
                        offerCount: linkedDestination?.offerCount || 0
                      });
                    }
                  }}
                  onPointerLeave={() => {
                    if (!dragStart.current) {
                      setHoveredCountryId(undefined);
                      setHoveredCountryInfo(undefined);
                    }
                  }}
                />
              );

              if (!linkedDestination) {
                return <g key={item.id ?? item.properties?.name}>{countryShape}</g>;
              }

              return (
                <g
                  key={item.id ?? item.properties?.name}
                  role="link"
                  tabIndex={0}
                  onClick={(event) => {
                    if (draggedLink.current) {
                      event.preventDefault();
                      return;
                    }

                    openDestination(linkedDestination);
                  }}
                  onKeyDown={(event) => handleDestinationKeyDown(event, linkedDestination)}
                >
                  <title>{`${linkedDestination.country}: ${offerCountLabel(linkedDestination.offerCount)}`}</title>
                  {countryShape}
                </g>
              );
            })}
          </g>
          {selectedPoint ? (
            <g className="real-globe-selected-marker" transform={`translate(${selectedPoint[0]} ${selectedPoint[1]})`}>
              <circle className="real-globe-selected-pulse" r="16" />
              <circle className="real-globe-selected-dot" r="4.5" />
            </g>
          ) : null}
          {spherePath ? <path className="real-globe-rim" d={spherePath} /> : null}
        </svg>
      </div>
      {tooltipInfo ? (
        <div
          className="destination-globe-tooltip"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y
          }}
        >
          <strong>{tooltipInfo.country}</strong>
          <span>{offerCountLabel(tooltipInfo.offerCount)}</span>
        </div>
      ) : null}
    </div>
  );
}
