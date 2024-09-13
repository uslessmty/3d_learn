import React, { useEffect, useRef } from "react";

const dot = (a, b) => {
    return a.reduce((res, cur, index) => {
        return res + cur * b[index];
    }, 0)
}
const length = (a) => {
    return Math.sqrt(dot(a, a));
}

const MAX = Number.MAX_VALUE
export default function Canvas() {
    const ref= useRef(null);
    
    const BACKGROUND_COLOR = [255, 255, 255]
    const CANVAS_HEIGHT = 500;
    const CANVAS_WIDTH = 500;

    const VIEWPORT_HEIGHT = 1;
    const VIEWPORT_WIDTH = 1;
    const VIEWPORT_DISTANCE = 1;

    const XArea = [-CANVAS_WIDTH / 2, CANVAS_WIDTH / 2];
    const YArea = [-CANVAS_HEIGHT / 2, CANVAS_HEIGHT / 2];
    const O = [0, 0, 0,];

    const sphere0 = {
        center: [0, -1, 3],
        radius: 1,
        color: [255, 0, 0]
    };
    const sphere1 = {
        center: [2, 0, 4],
        radius: 1,
        color: [0, 0, 255]
    };
    const sphere2 = {
        center: [-2, 0, 4],
        radius: 1,
        color: [0, 255, 0]
    };
    const sphere3 = {
        center: [0, -5001, 0],
        radius: 5000,
        color: [255, 255, 0]
    };
    const spheres = [sphere0, sphere1, sphere2, sphere3];

    const light0 = {
        type: 'ambient',
        intensity: 0.2,
    }
    const light1 = {
        type: 'point',
        intensity: 0.6,
        position: [2, 1, 0]
    }
    const light2 = {
        type: 'directional',
        intensity: 0.2,
        direction: [1, 4, 4]
    }
    const lights = [light0, light1, light2];

    const ComputeLighting = (P, N) => {
        let i = 0;
        for (const light of lights) {
            switch (light.type) {
                case 'ambient': {
                    i += light.intensity;
                    break
                }
                case 'point':
                case  'directional': {
                    let L = [0, 0, 0];
                    if (light.type === 'point') {
                        L = [light.position[0] - P[0], light.position[1] - P[1], light.position[2] - P[2]];
                    } else {
                        
                        L = [light.direction[0], light.direction[1], light.direction[2]];
                    }
                    const n_dot_l = dot(L, N);
                    if (n_dot_l > 0) {
                        i += light.intensity * n_dot_l / (length(L) * length(N));
                    }
                }
            }
        }
        return Math.min(i, 1);
    }

    const CanvasToViewport = (x, y) => {

        return [x * VIEWPORT_WIDTH / CANVAS_WIDTH, y * VIEWPORT_HEIGHT / CANVAS_HEIGHT, VIEWPORT_DISTANCE];
    };

    const IntersectRaySphere = (O, D, sphere) => {
        const r = sphere.radius
        const CO = [O[0] - sphere.center[0], O[1] - sphere.center[1], O[2] - sphere.center[2]];
        const a = dot(D, D)
        const b = 2 * dot(CO, D)
        const c = dot(CO, CO) - r * r

        const discriminant = b * b - 4 * a * c
        if (discriminant < 0) {
            return []
        }

        const t1 = (-b + Math.sqrt(discriminant)) / (2 * a)
        const t2 = (-b - Math.sqrt(discriminant)) / (2 * a)
        return [t1, t2]
    }

    const TraceRay = (O, D, min, max) => {
        let closest_t = MAX
        let closest_sphere = null;

        for (const sphere of spheres) {
            const array = IntersectRaySphere(O, D, sphere);
            if (array.length === 0) {
                continue;
            }
            const [t1, t2] = array
            if (t1 >= min && t1 <= max && t1 < closest_t) {
                closest_t = t1
                closest_sphere = sphere
            }
            if (t2 >= min && t2 <= max && t2 < closest_t) {
                closest_t = t2
                closest_sphere = sphere
            }
        }
        if (!!closest_sphere) {
            const P = [closest_t * D[0] + O[0], closest_t * D[1] + O[1], closest_t * D[2] + O[2]];
            const N = [P[0] - closest_sphere.center[0], P[1] - closest_sphere.center[1], P[2] - closest_sphere.center[2]];
            const i = ComputeLighting(P, N);

            return closest_sphere.color.map(v => v * i);
        } else {
            return BACKGROUND_COLOR;
        }
    }

    const PutPixel = (x, y, color) => {
        y = -y;
        x = Math.round(x + CANVAS_WIDTH / 2);
        y = Math.round(y + CANVAS_HEIGHT / 2);
        const canvas = ref.current;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
        ctx.fillRect(x, y, 1, 1);
    };
    
    useEffect(() => {
        const main = () => {
            for (let i = XArea[0]; i < XArea[1]; i++) {
                for (let j = YArea[0]; j < YArea[1]; j++) {
                    const D = CanvasToViewport(i, j);
                    const color = TraceRay(O, D, 1, MAX);
                    
                    PutPixel(i, j, color);
                }
            }
            
        }
        main();
    }, []);

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <canvas
                ref={ref}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                style={{
                    border: '2px solid #000'
                }}
            />
        </div>
    );
}