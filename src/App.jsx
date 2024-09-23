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
    
    const BACKGROUND_COLOR = [0, 0, 0]
    const CANVAS_HEIGHT = 500;
    const CANVAS_WIDTH = 500;

    const VIEWPORT_HEIGHT = 1;
    const VIEWPORT_WIDTH = 1;
    const VIEWPORT_DISTANCE = 1;

    const XArea = [-CANVAS_WIDTH / 2, CANVAS_WIDTH / 2];
    const YArea = [-CANVAS_HEIGHT / 2, CANVAS_HEIGHT / 2];

    const sphere0 = {
        center: [0, -1, 3],
        radius: 1,
        color: [255, 0, 0],
        specular: 500,
        reflective: 0.2
    };
    const sphere1 = {
        center: [2, 0, 4],
        radius: 1,
        color: [0, 0, 255],
        specular: 500,
        reflective: 0.3
    };
    const sphere2 = {
        center: [-2, 0, 4],
        radius: 1,
        color: [0, 255, 0],
        specular: 10,
        reflective: 0.4
    };
    const sphere3 = {
        center: [0, -5001, 0],
        radius: 5000,
        color: [255, 255, 0],
        specular: 1000,
        reflective: 0.5
    };
    const camera = {
        rotation: [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
        ],
        position: [0, 1, 0],  
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

    const MaxtrixMultiVector = (M, V) => {
        return V.map((v, index) => {
            return M[index].reduce((res, cur,) => {
                return res + cur * v;
            }, 0)
        })
    }
    
    const ReflectRay = (R, N) => {
        const n_dot_r = dot(N, R);
        return [2 * n_dot_r * N[0] - R[0], 2 * n_dot_r * N[1] - R[1], 2 * n_dot_r * N[2] - R[2]];
    }
    const ComputeLighting = (P, N, V, s) => {
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

                    const [shadow_sphere,] = ClosestIntersection(P, L, 0.001, light.type === 'point' ? 1 : MAX);

                    if (!!shadow_sphere) {
                        continue;
                    }

                    const n_dot_l = dot(L, N);
                    if (n_dot_l > 0) {
                        i += light.intensity * n_dot_l / (length(L) * length(N));
                    }
                    if (!!s && s > 0) {
                        const n_dot_l = dot(N, L);
                        const R = [2 * N[0] * n_dot_l - L[0], 2 * N[1] * n_dot_l - L[1], 2 * N[2] * n_dot_l - L[2]];
                        const r_dot_v = dot(R, V);
                        if (r_dot_v > 0) {
                            i += light.intensity * Math.pow(r_dot_v / (length(R) * length(V)), s);
                        }
                    }
                }
            }
        }
        return Math.min(i, 1);
    }

    const CanvasToViewport = (x, y) => {

        return [x * VIEWPORT_WIDTH / CANVAS_WIDTH, y * VIEWPORT_HEIGHT / CANVAS_HEIGHT, VIEWPORT_DISTANCE];
    };

    const ClosestIntersection = (O, D, t_min, t_max) => {
        let closest_t = MAX
        let closest_sphere = null;
        for (const sphere of spheres) {
            const array = IntersectRaySphere(O, D, sphere);
            if (array.length === 0) {
                continue;
            }
            const [t1, t2] = array
            if (t1 >= t_min && t1 <= t_max && t1 < closest_t) {
                closest_t = t1
                closest_sphere = sphere
            }
            
            if (t2 >= t_min && t2 <= t_max && t2 < closest_t) {
                closest_t = t2
                closest_sphere = sphere
            }
        }

        return [closest_sphere, closest_t]
    }

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

    const TraceRay = (O, D, min, max, recursion_depth) => {
        const [closest_sphere, closest_t] = ClosestIntersection(O, D, min, max);
        if (!!closest_sphere) {
            const P = [closest_t * D[0] + O[0], closest_t * D[1] + O[1], closest_t * D[2] + O[2]];
            let N = [P[0] - closest_sphere.center[0], P[1] - closest_sphere.center[1], P[2] - closest_sphere.center[2]];
            const length_n = length(N);
            N = [N[0] / length_n, N[1] / length_n, N[2] / length_n];
            const i = ComputeLighting(P, N, [-D[0], -D[1], -D[2]], closest_sphere.specular || 0);
            
            const local_color = closest_sphere.color.map(v => v * i);
            const r = closest_sphere.reflective;
            if (recursion_depth <= 0 || r <= 0) {
                return local_color
            }
            const R = ReflectRay(D.map(i => -i), N);
            const reflected_color = TraceRay(P, R, 0.001, MAX, recursion_depth - 1);
            const final_color = reflected_color.map((v, i) => v * r + local_color[i] * (1 - r));
            return final_color;
        } else {
            return BACKGROUND_COLOR;
        }
    }

    const DrawLine = (P0, P1, color) => {

        const dx = P1[0] - P0[0];
        const dy = P1[1] - P0[1];
        
        if (Math.abs(dx) > Math.abs(dy)) {
            if (P0[0] > P1[0]) {
                [P0, P1] = [P1, P0];
            }
            let ys = Interpolate(P0[0], P0[1], P1[0], P1[1]);
            for (let x = P0[0]; x <= P1[0]; x++) {
                PutPixel(x, ys[x - P0[0]], color);
            }
        } else {
            if (P0[1] > P1[1]) {
                [P0, P1] = [P1, P0];
            }
            let xs = Interpolate(P0[1], P0[0], P1[1], P1[0]);
            for (let y = P0[1]; y <= P1[1]; y++) {
                PutPixel(xs[y - P0[1]], y, color);
            }
        }
    }
    
    const Interpolate = (i0, d0, i1, d1) => {
        if (i0 == i1) reyurn [d0];
        
        const values = [];
        const a = (d1 - d0) / (i1 - i0);
        let d = d0;
        for (let i = i0; i <= i1; i++) {
            values.push(d);
            d = d + a;
        }
        return values;
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
            // for (let i = XArea[0]; i <= XArea[1]; i++) {
            //     for (let j = YArea[0]; j <= YArea[1]; j++) {
            //         const D = MaxtrixMultiVector(camera.rotation, CanvasToViewport(i, j));
                    
            //         const color = TraceRay(camera.position, D, 1, MAX, 1);
                    
            //         PutPixel(i, j, color);
            //     }
            // }
            DrawLine([-50, -200], [60, 240], [255, 0, 0])
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