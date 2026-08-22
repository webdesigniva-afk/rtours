"use client";

import { PointerEvent, useEffect, useMemo, useRef, useState } from "react";
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

function getBulgarianCountryName(countryName: string | undefined) {
  if (!countryName) {
    return "Държава";
  }

  return bulgarianCountryNames[countryName] ?? countryName;
}

function offerCountLabel(count: number) {
  return count === 1 ? "1 оферта" : `${count} оферти`;
}

export function DestinationGlobe({
  country,
  destinations = [],
  highlightSelectedCountry = true
}: {
  country: string;
  destinations?: GlobeDestination[];
  highlightSelectedCountry?: boolean;
}) {
  const [hoveredCountryId, setHoveredCountryId] = useState<string | undefined>();
  const [hoveredCountryInfo, setHoveredCountryInfo] = useState<HoveredCountryInfo | undefined>();
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const selectedCountry = highlightSelectedCountry && country.trim() ? findCountry(country) : undefined;
  const center = selectedCountry ? geoCentroid(selectedCountry as never) : [22, 36];
  const initialRotation = useMemo<[number, number]>(() => [-center[0], -center[1]], [center[0], center[1]]);
  const [rotation, setRotation] = useState<[number, number]>(initialRotation);
  const [zoom, setZoom] = useState(1.34);
  const rotationRef = useRef<[number, number]>(initialRotation);
  const zoomRef = useRef(1.34);
  const globeRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragStart = useRef<{ x: number; y: number; rotation: [number, number]; moved: boolean } | null>(null);
  const draggedLink = useRef(false);

  useEffect(() => {
    setRotation(initialRotation);
    rotationRef.current = initialRotation;
    setZoom(1.34);
    zoomRef.current = 1.34;
  }, [initialRotation]);

  useEffect(() => {
    const globeElement = globeRef.current;
    if (!globeElement) {
      return;
    }

    function handleNativeWheel(event: WheelEvent) {
      event.preventDefault();
      const nextZoom = clamp(zoomRef.current - event.deltaY * 0.00145, 1, 3.25);
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

              const isSelected = selectedCountry?.id === item.id;
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
                        country: linkedDestination?.country || getBulgarianCountryName(item.properties?.name),
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
                  tabIndex={linkedDestination ? 0 : -1}
                />
              );

              if (!linkedDestination) {
                return <g key={item.id ?? item.properties?.name}>{countryShape}</g>;
              }

              return (
                <a
                  href={`/destinations/${linkedDestination.slug}`}
                  key={item.id ?? item.properties?.name}
                  onClick={(event) => {
                    if (draggedLink.current) {
                      event.preventDefault();
                    }
                  }}
                >
                  <title>{`${linkedDestination.country}: ${offerCountLabel(linkedDestination.offerCount)}`}</title>
                  {countryShape}
                </a>
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
