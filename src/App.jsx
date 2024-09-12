import React, { useEffect, useRef } from "react";

const dot = (a, b) => {
    return a.reduce((res, cur, index) => {
        return res + cur * b[index];
    }, 0)
}
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
    const spheres = [sphere0, sphere1, sphere2];
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
        let closest_t = 10000
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
            } else if (t2 >= min && t2 <= max && t2 < closest_t) {
                closest_t = t2
                closest_sphere = sphere
            }
        }
        if (!!closest_sphere) {
            return closest_sphere.color;
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
                    const color = TraceRay(O, D, 1, 10000);
                    
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