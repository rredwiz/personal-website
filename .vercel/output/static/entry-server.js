import { jsxs, jsx } from "react/jsx-runtime";
import { forwardRef, useLayoutEffect, useRef, useMemo, useState, useEffect, StrictMode } from "react";
import { renderToPipeableStream } from "react-dom/server";
import { useThree, useFrame, Canvas } from "@react-three/fiber";
import { Color } from "three";
const hexToNormalizedRGB = (hex) => {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return [r, g, b];
};
const vertexShader = `
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vPosition = position;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const fragmentShader = `
varying vec2 vUv;
varying vec3 vPosition;

uniform float uTime;
uniform vec3  uColor;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uNoiseIntensity;

const float e = 2.71828182845904523536;

float noise(vec2 texCoord) {
  float G = e;
  vec2  r = (G * sin(G * texCoord));
  return fract(r.x * r.y * (1.0 + texCoord.x));
}

vec2 rotateUvs(vec2 uv, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  mat2  rot = mat2(c, -s, s, c);
  return rot * uv;
}

void main() {
  float rnd        = noise(gl_FragCoord.xy);
  vec2  uv         = rotateUvs(vUv * uScale, uRotation);
  vec2  tex        = uv * uScale;
  float tOffset    = uSpeed * uTime;

  tex.y += 0.03 * sin(8.0 * tex.x - tOffset);

  float pattern = 0.6 +
                  0.4 * sin(5.0 * (tex.x + tex.y +
                                   cos(3.0 * tex.x + 5.0 * tex.y) +
                                   0.02 * tOffset) +
                           sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));

  vec4 col = vec4(uColor, 1.0) * vec4(pattern) - rnd / 15.0 * uNoiseIntensity;
  col.a = 1.0;
  gl_FragColor = col;
}
`;
const SilkPlane = forwardRef(function SilkPlane2({ uniforms }, ref) {
  const { viewport } = useThree();
  useLayoutEffect(() => {
    const mesh = ref;
    if (mesh.current) {
      mesh.current.scale.set(viewport.width, viewport.height, 1);
    }
  }, [ref, viewport]);
  useFrame((_state, delta) => {
    const mesh = ref;
    if (mesh.current) {
      const material = mesh.current.material;
      material.uniforms.uTime.value += 0.1 * delta;
    }
  });
  return /* @__PURE__ */ jsxs("mesh", { ref, children: [
    /* @__PURE__ */ jsx("planeGeometry", { args: [1, 1, 1, 1] }),
    /* @__PURE__ */ jsx(
      "shaderMaterial",
      {
        uniforms,
        vertexShader,
        fragmentShader
      }
    )
  ] });
});
SilkPlane.displayName = "SilkPlane";
const Silk = ({
  speed = 5,
  scale = 1,
  color = "#7B7481",
  noiseIntensity = 1.5,
  rotation = 0
}) => {
  const meshRef = useRef(null);
  const uniforms = useMemo(
    () => ({
      uSpeed: { value: speed },
      uScale: { value: scale },
      uNoiseIntensity: { value: noiseIntensity },
      uColor: { value: new Color(...hexToNormalizedRGB(color)) },
      uRotation: { value: rotation },
      uTime: { value: 0 }
    }),
    [speed, scale, noiseIntensity, color, rotation]
  );
  return /* @__PURE__ */ jsx(Canvas, { dpr: [1, 2], frameloop: "always", children: /* @__PURE__ */ jsx(SilkPlane, { ref: meshRef, uniforms }) });
};
function Background() {
  const [isVisible, setIsVisible] = useState(false);
  const [transitionState, setTransition] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      document.body.style.background = "";
      setTransition(true);
      setIsVisible(true);
    }, 200);
  }, []);
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: `${isVisible ? "opacity-100" : "opacity-0"} ${transitionState ? "transition-opacity" : "transition-none"} h-screen w-screen absolute inset-0 z-[-1] duration-2000 ease-in-out`,
      children: /* @__PURE__ */ jsx(
        Silk,
        {
          speed: 5,
          scale: 0.6,
          color: "#232323",
          noiseIntensity: 0.1,
          rotation: 2.18
        }
      )
    }
  );
}
const ImageIcon = "/assets/ImageIcon-DmCyYwl2.png";
const locationIcon = "data:image/svg+xml,%3c!DOCTYPE%20svg%20PUBLIC%20'-//W3C//DTD%20SVG%201.1//EN'%20'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Transformed%20by:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%2024%2024'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cg%20id='SVGRepo_bgCarrier'%20stroke-width='0'/%3e%3cg%20id='SVGRepo_tracerCarrier'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cg%20id='SVGRepo_iconCarrier'%3e%3cpath%20d='M12%2021C15.5%2017.4%2019%2014.1764%2019%2010.2C19%206.22355%2015.866%203%2012%203C8.13401%203%205%206.22355%205%2010.2C5%2014.1764%208.5%2017.4%2012%2021Z'%20stroke='%239CA3AF'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cpath%20d='M12%2012C13.1046%2012%2014%2011.1046%2014%2010C14%208.89543%2013.1046%208%2012%208C10.8954%208%2010%208.89543%2010%2010C10%2011.1046%2010.8954%2012%2012%2012Z'%20stroke='%239CA3AF'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/g%3e%3c/svg%3e";
const linkedinIcon = "data:image/svg+xml,%3c!DOCTYPE%20svg%20PUBLIC%20'-//W3C//DTD%20SVG%201.1//EN'%20'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Transformed%20by:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20fill='%239ca3af'%20width='800px'%20height='800px'%20viewBox='0%200%2032%2032'%20version='1.1'%20xmlns='http://www.w3.org/2000/svg'%20stroke='%239ca3af'%3e%3cg%20id='SVGRepo_bgCarrier'%20stroke-width='0'/%3e%3cg%20id='SVGRepo_tracerCarrier'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cg%20id='SVGRepo_iconCarrier'%3e%3ctitle%3elinkedin%3c/title%3e%3cpath%20d='M28.778%201.004h-25.56c-0.008-0-0.017-0-0.027-0-1.199%200-2.172%200.964-2.186%202.159v25.672c0.014%201.196%200.987%202.161%202.186%202.161%200.010%200%200.019-0%200.029-0h25.555c0.008%200%200.018%200%200.028%200%201.2%200%202.175-0.963%202.194-2.159l0-0.002v-25.67c-0.019-1.197-0.994-2.161-2.195-2.161-0.010%200-0.019%200-0.029%200h0.001zM9.9%2026.562h-4.454v-14.311h4.454zM7.674%2010.293c-1.425%200-2.579-1.155-2.579-2.579s1.155-2.579%202.579-2.579c1.424%200%202.579%201.154%202.579%202.578v0c0%200.001%200%200.002%200%200.004%200%201.423-1.154%202.577-2.577%202.577-0.001%200-0.002%200-0.003%200h0zM26.556%2026.562h-4.441v-6.959c0-1.66-0.034-3.795-2.314-3.795-2.316%200-2.669%201.806-2.669%203.673v7.082h-4.441v-14.311h4.266v1.951h0.058c0.828-1.395%202.326-2.315%204.039-2.315%200.061%200%200.121%200.001%200.181%200.003l-0.009-0c4.5%200%205.332%202.962%205.332%206.817v7.855z'/%3e%3c/g%3e%3c/svg%3e";
const githubIcon = "data:image/svg+xml,%3c!DOCTYPE%20svg%20PUBLIC%20'-//W3C//DTD%20SVG%201.1//EN'%20'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3e%3c!--%20Uploaded%20to:%20SVG%20Repo,%20www.svgrepo.com,%20Transformed%20by:%20SVG%20Repo%20Mixer%20Tools%20--%3e%3csvg%20width='800px'%20height='800px'%20viewBox='0%200%2020%2020'%20version='1.1'%20xmlns='http://www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%20fill='%239ca3af'%20stroke='%239ca3af'%3e%3cg%20id='SVGRepo_bgCarrier'%20stroke-width='0'/%3e%3cg%20id='SVGRepo_tracerCarrier'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3cg%20id='SVGRepo_iconCarrier'%3e%3ctitle%3egithub%20[%239ca3af142]%3c/title%3e%3cdesc%3eCreated%20with%20Sketch.%3c/desc%3e%3cdefs%3e%3c/defs%3e%3cg%20id='Page-1'%20stroke='none'%20stroke-width='1'%20fill='none'%20fill-rule='evenodd'%3e%3cg%20id='Dribbble-Light-Preview'%20transform='translate(-140.000000,%20-7559.000000)'%20fill='%239ca3af'%3e%3cg%20id='icons'%20transform='translate(56.000000,%20160.000000)'%3e%3cpath%20d='M94,7399%20C99.523,7399%20104,7403.59%20104,7409.253%20C104,7413.782%20101.138,7417.624%2097.167,7418.981%20C96.66,7419.082%2096.48,7418.762%2096.48,7418.489%20C96.48,7418.151%2096.492,7417.047%2096.492,7415.675%20C96.492,7414.719%2096.172,7414.095%2095.813,7413.777%20C98.04,7413.523%20100.38,7412.656%20100.38,7408.718%20C100.38,7407.598%2099.992,7406.684%2099.35,7405.966%20C99.454,7405.707%2099.797,7404.664%2099.252,7403.252%20C99.252,7403.252%2098.414,7402.977%2096.505,7404.303%20C95.706,7404.076%2094.85,7403.962%2094,7403.958%20C93.15,7403.962%2092.295,7404.076%2091.497,7404.303%20C89.586,7402.977%2088.746,7403.252%2088.746,7403.252%20C88.203,7404.664%2088.546,7405.707%2088.649,7405.966%20C88.01,7406.684%2087.619,7407.598%2087.619,7408.718%20C87.619,7412.646%2089.954,7413.526%2092.175,7413.785%20C91.889,7414.041%2091.63,7414.493%2091.54,7415.156%20C90.97,7415.418%2089.522,7415.871%2088.63,7414.304%20C88.63,7414.304%2088.101,7413.319%2087.097,7413.247%20C87.097,7413.247%2086.122,7413.234%2087.029,7413.87%20C87.029,7413.87%2087.684,7414.185%2088.139,7415.37%20C88.139,7415.37%2088.726,7417.2%2091.508,7416.58%20C91.513,7417.437%2091.522,7418.245%2091.522,7418.489%20C91.522,7418.76%2091.338,7419.077%2090.839,7418.982%20C86.865,7417.627%2084,7413.783%2084,7409.253%20C84,7403.59%2088.478,7399%2094,7399'%20id='github-[%239ca3af142]'%3e%3c/path%3e%3c/g%3e%3c/g%3e%3c/g%3e%3c/g%3e%3c/svg%3e";
const blueskyIcon = "data:image/svg+xml,%3csvg%20width='40'%20height='40'%20viewBox='0%200%20256%20226'%20xmlns='http://www.w3.org/2000/svg'%3e%3crect%20x='0'%20y='0'%20width='256'%20height='226'%20rx='8'%20fill='none'/%3e%3csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20256%20226'%20x='0'%20y='0'%20width='256'%20height='226'%3e%3cpath%20fill='%239CA3AF'%20d='M55.491%2015.172c29.35%2022.035%2060.917%2066.712%2072.509%2090.686c11.592-23.974%2043.159-68.651%2072.509-90.686C221.686-.727%20256-13.028%20256%2026.116c0%207.818-4.482%2065.674-7.111%2075.068c-9.138%2032.654-42.436%2040.983-72.057%2035.942c51.775%208.812%2064.946%2038%2036.501%2067.187c-54.021%2055.433-77.644-13.908-83.696-31.676c-1.11-3.257-1.63-4.78-1.637-3.485c-.008-1.296-.527.228-1.637%203.485c-6.052%2017.768-29.675%2087.11-83.696%2031.676c-28.445-29.187-15.274-58.375%2036.5-67.187c-29.62%205.041-62.918-3.288-72.056-35.942C4.482%2091.79%200%2033.934%200%2026.116C0-13.028%2034.314-.727%2055.491%2015.172'/%3e%3c/svg%3e%3c/svg%3e";
function App() {
  return /* @__PURE__ */ jsxs("div", { className: "flex justify-center items-center w-full h-screen", children: [
    /* @__PURE__ */ jsx(Background, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex m-8 flex-col md:grid md:grid-cols-3 gap-4 w-3xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex gap-4 sm:gap-0 md:block p-4 col-span-1 bg-black/25 h-auto rounded-xl shadow-md border border-gray-500/25", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:justify-around gap-2 items-center justify-center", children: [
          /* @__PURE__ */ jsx(
            "img",
            {
              src: ImageIcon,
              className: "mb-2 rounded-full md:w-20"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-center md:justify-start items-center gap-4", children: [
            /* @__PURE__ */ jsx(
              "a",
              {
                href: "https://github.com/rredwiz",
                target: "_blank",
                children: /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: githubIcon,
                    className: "w-6 hover:scale-110"
                  }
                )
              }
            ),
            /* @__PURE__ */ jsx(
              "a",
              {
                href: "https://www.linkedin.com/in/andrew-dutka-65368135a/",
                target: "_blank",
                children: /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: linkedinIcon,
                    className: "w-6 hover:scale-110"
                  }
                )
              }
            ),
            /* @__PURE__ */ jsx(
              "a",
              {
                href: "https://bsky.app/profile/rredwiz.bsky.social",
                target: "_blank",
                children: /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: blueskyIcon,
                    className: "w-6 hover:scale-110 mr-1"
                  }
                )
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pointer-events-none md:block flex flex-col justify-center md:m-0 m-auto", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-white md:text-2xl sm:text-5xl text-4xl", children: [
            "Hey, I'm",
            " ",
            /* @__PURE__ */ jsx("span", { className: "md:font-semibold font-bold", children: "Andrew" }),
            "."
          ] }),
          /* @__PURE__ */ jsx("p", { className: "md:text-sm text-lg text-gray-400 md:mt-0 mt-2", children: "CS Student & Developer" }),
          /* @__PURE__ */ jsxs("div", { className: "flex mt-2 gap-1 justify-start items-center", children: [
            /* @__PURE__ */ jsx("img", { src: locationIcon, className: "w-4" }),
            /* @__PURE__ */ jsx("p", { className: "md:text-xs text-sm text-gray-400", children: "Nova Scotia, Canada" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-4 col-span-2 bg-black/25 h-auto rounded-xl shadow-md border border-gray-500/25", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs text-white font-mono", children: /* @__PURE__ */ jsxs("a", { href: "https://github.com/rredwiz", target: "_blank", children: [
          "andrew",
          /* @__PURE__ */ jsx("span", { className: "text-gray-400", children: "/" }),
          "README",
          /* @__PURE__ */ jsx("span", { className: "text-gray-400", children: ".md" })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "mt-2", children: /* @__PURE__ */ jsx("h3", { className: "text-white font-semibold text-2xl border-b-1 border-gray-600 inline", children: "Slice of Me" }) }),
        /* @__PURE__ */ jsx("div", { className: "mt-2", children: /* @__PURE__ */ jsx("p", { className: "text-white text-md", children: "I'm a currently-enrolled Computer Science student and dedicated programming hobbyist. At the moment, I'm occupying my time learning how to use a variety of full-stack development tools and frameworks to build cool things." }) })
      ] })
    ] })
  ] });
}
function render(_url, options) {
  return renderToPipeableStream(
    /* @__PURE__ */ jsx(StrictMode, { children: /* @__PURE__ */ jsx(App, {}) }),
    options
  );
}
export {
  render
};
