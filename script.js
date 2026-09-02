// ==========================================================================
// Style Rewinder - 3D Fashion Mixer 메인 클라이언트 스크립트
// ==========================================================================

// 기존 브라우저 캐시(잘못된 이미지 경로 및 스타일 세트) 1회 초기화
if (!localStorage.getItem('fm_reset_v7')) {
    localStorage.clear();
    if (window.indexedDB) {
        indexedDB.deleteDatabase('FashionMixerDB');
    }
    localStorage.setItem('fm_reset_v7', 'true');
    console.log('Previous cached data cleared for v7 update.');
}

// --------------------------------------------------------------------------
// 1. 디버그 로거 및 에러 리스너
// --------------------------------------------------------------------------
function logDebug(msg) {
    console.log(msg);
    const d = document.getElementById('debug-log');
    if(d) d.innerHTML += '<div>' + msg + '</div>';
}
window.addEventListener('error', function(e) { logDebug('❌ ERROR: ' + e.message); });

// --------------------------------------------------------------------------
// 2. Three.js 렌더링 전역 객체 및 인터랙션 상태 변수
// --------------------------------------------------------------------------
let scene, camera, renderer, cylinders = [];

// 마우스/터치 드래그 및 회전 관련 상태
let isDragging = false, dragStartX = 0, dragStartRotation = 0, dragStartRotations = [], activeCylinderIndex = -1;
let isHovering = false; 
let hoveredCylinderIndex = -1;
let lastInteractionTime = 0; 
let pauseAutoDuration = 0; // 마우스가 이미지 위에 올랐을 때 자동 회전을 즉시 일시정지하는 타이머
let pointerStartTime = 0, pointerStartPos = { x: 0, y: 0 }; 

// 원통 배치 및 회전 정밀도 파라미터
const ITEM_COUNT = 20;                             // 원통 1개당 배치되는 패션 아이템 슬롯 개수 (20개)
const CYLINDER_RADIUS = 0.9;                       // 3D 원통 반경
let isLocked = false;                              // 전시 모드(Locked Mode) 잠금 여부
const SLOT_WIDTH = (2 * Math.PI * CYLINDER_RADIUS) / ITEM_COUNT; // 1개 아이템 슬롯 호의 길이
const ROTATION_STEP = (Math.PI * 2) / ITEM_COUNT;  // 아이템 1개당 회전 각도 (18도)

// 2D 펼침 모드 (Unrolled Flat View) 및 3D 원통 모프(Morph) 변수
let isFlatView = false;                            // 현재 2D 펼침 모드 활성화 여부
let flattenProgress = 0;                           // 3D -> 2D 변환 현재 진행률 (0: 3D, 1: 2D)
let targetFlattenProgress = 0;                     // 목표 변환 진행률

// 카메라 줌(Zoom) 관련 변수 (휠 & 트랙패드 지원)
let currentZoom = 1.0;                             // 현재 줌 배율
let targetZoom = 1.0;                              // 목표 줌 배율
const MIN_ZOOM = 0.4;                              // 줌 인 최고 한계 (카메라 접근)
const MAX_ZOOM = 2.5;                              // 줌 아웃 최고 한계 (카메라 후퇴)


let CATEGORIES = [
    {
        "id": 0,
        "name": "HAT",
        "items": [
            {
                "url": "images/HAT/hat_1.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_2.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_3.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_4.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_5.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_6.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_7.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_8.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_9.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_10.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_11.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_12.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_13.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_14.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_15.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_16.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_17.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_18.png",
                "setIds": []
            },
            {
                "url": "images/HAT/hat_19.png",
                "setIds": []
            }
        ]
    },
    {
        "id": 1,
        "name": "ACC",
        "items": [
            {
                "url": "images/ACC/acc_1.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_2.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_3.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_4.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_5.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_6.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_7.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_8.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_9.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_10.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_11.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_12.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_13.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_14.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_15.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_16.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_17.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_18.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_19.png",
                "setIds": []
            },
            {
                "url": "images/ACC/acc_20.png",
                "setIds": []
            }
        ]
    },
    {
        "id": 2,
        "name": "TOP",
        "items": [
            {
                "url": "images/TOP/top_1.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_2.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_3.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_4.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_5.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_6.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_7.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_8.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_9.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_10.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_11.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_12.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_13.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_14.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_15.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_16.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_17.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_18.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_19.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_20.png",
                "setIds": []
            },
            {
                "url": "images/TOP/top_21.png",
                "setIds": []
            }
        ]
    },
    {
        "id": 3,
        "name": "BOTTOM",
        "items": [
            {
                "url": "images/BOOTOM/bottom_1.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_2.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_3.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_4.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_5.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_6.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_7.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_8.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_9.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_10.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_11.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_12.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_13.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_14.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_15.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_16.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_17.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_18.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_19.png",
                "setIds": []
            },
            {
                "url": "images/BOOTOM/bottom_20.png",
                "setIds": []
            }
        ]
    },
    {
        "id": 4,
        "name": "SHOES",
        "items": [
            {
                "url": "images/SHOES/shoes_1.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_2.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_3.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_4.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_5.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_6.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_7.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_8.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_9.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_10.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_11.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_12.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_13.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_14.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_15.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_16.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_17.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_18.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_19.png",
                "setIds": []
            },
            {
                "url": "images/SHOES/shoes_20.png",
                "setIds": []
            }
        ]
    }
];
let STYLE_SETS = [{ id: 1, name: 'STYLING 1' }];
let editingSetId = null;

// --------------------------------------------------------------------------
// 3. 카테고리별 원통 높이 계산 함수 (HAT, ACC, TOP, BOTTOM, SHOES)
// --------------------------------------------------------------------------
function getCylinderHeight(index) {
    let h = 7.0; 
    if (index === 0) h = 8.5;       // HAT (모자 원통 높이)
    else if (index === 1) h = 5.0;  // ACC (액세서리 원통 높이)
    else if (index === 2) h = 18.0; // TOP (상의 원통 높이)
    else if (index === 3) h = 22.0; // BOTTOM (하의 원통 높이)
    else if (index === 4) h = 7.0;  // SHOES (신발 원통 높이)
    return SLOT_WIDTH * (h / 16); 
}

// --------------------------------------------------------------------------
// 4. Three.js 3D 씬 및 이벤트 리스너 초기화 (init)
// --------------------------------------------------------------------------
async function init() {
    try {
        cylinders = [];
        scene = new THREE.Scene(); 
        scene.background = null; // CSS 무대 그라데이션 배경이 보이도록 투명 처리
        scene.fog = new THREE.Fog(0x050505, 10, 50); // 공간감을 위한 다크 포그 효과
        camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000); 
        camera.position.set(0, 0, 3); // 카메라 기본 거리 설정
        
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: "high-performance" }); 
        renderer.setSize(window.innerWidth, window.innerHeight); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.0)); 
        const canvasContainer = document.getElementById('canvas-container');
        if (canvasContainer) {
            canvasContainer.innerHTML = '';
            canvasContainer.appendChild(renderer.domElement);
        }
        
        // 조명 설정 (AmbientLight + DirectionalLight)
        scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const L2 = new THREE.DirectionalLight(0xffffff, 0.8); L2.position.set(10, 20, 10); scene.add(L2);
        
        // 5개 카테고리별 원통 3D 메시 생성 및 씬에 추가
        for (let i = 0; i < CATEGORIES.length; i++) {
            const cyl = await createCylinderMesh(i); scene.add(cyl.group);
        }
        await loadEverything();
    } catch (error) { 
        logDebug('❌ INIT FAIL: ' + error.message); 
    } finally { 
        setTimeout(hideLoader, 1000); 
    }
    
    // 리사이즈 이벤트 대응
    window.addEventListener('resize', () => { 
        camera.aspect = window.innerWidth / window.innerHeight; 
        camera.updateProjectionMatrix(); 
        renderer.setSize(window.innerWidth, window.innerHeight); 
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.0));
    });
    
    const cont = document.getElementById('canvas-container');
    if (cont) {
        cont.addEventListener('pointerdown', onPointerDown); 
        cont.addEventListener('dblclick', (e) => {
            toggleFullScreen();
        });
    }
    window.addEventListener('pointermove', onPointerMove); 
    window.addEventListener('pointerup', onPointerUp);
    
    // 배경 영역 더블클릭 시 전체화면 토글
    window.addEventListener('dblclick', (e) => {
        if (e.target === document.body || e.target.id === 'canvas-container' || e.target.tagName === 'CANVAS') {
            toggleFullScreen();
        }
    });

    // 마우스 휠 및 트랙패드 줌 이벤트
    window.addEventListener('wheel', onWheelZoom, { passive: false });

    // 모바일/트랙패드 멀티터치 핀치 줌(Pinch Zoom) 지원
    let touchStartDist = 0;
    let initialZoomOnTouch = 1.0;
    window.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            touchStartDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            initialZoomOnTouch = targetZoom;
        }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && touchStartDist > 0) {
            const currentDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            if (currentDist > 0) {
                const factor = touchStartDist / currentDist;
                targetZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, initialZoomOnTouch * factor));
                if (e.cancelable) e.preventDefault();
            }
        }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
        if (e.touches.length < 2) touchStartDist = 0;
    }, { passive: true });
    
    animate();

    // 좌측 스타일 휠 수직 스크롤 이벤트 연결
    const sideView = document.getElementById('side-style-container');
    if (sideView) sideView.addEventListener('scroll', updateActiveSideStyle);
}

// --------------------------------------------------------------------------
// 5. 마우스 휠 & 핀치 줌 컨트롤 (onWheelZoom)
// --------------------------------------------------------------------------
function onWheelZoom(e) {
    // 팝업, 모달, 관리자 패널 스크롤 시 3D 카메라 줌 작동 방지
    if (e.target.closest('#side-style-container, #management-panel, #instruction-overlay, #info-popup, .instruction-card, .info-card')) {
        return;
    }
    e.preventDefault();
    targetZoom += e.deltaY * 0.0012;
    targetZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetZoom));
}

// 갤러리 썸네일 그리드 휠 가로 스크롤 전환
window.addEventListener('wheel', (e) => {
    const grid = e.target.closest('.thumbnail-grid');
    if (grid) {
        if (e.deltaY !== 0) {
            grid.scrollLeft += e.deltaY;
            if (e.cancelable) e.preventDefault();
            e.stopPropagation();
        }
    }
}, { passive: false });

// 갤러리 썸네일 그리드 드래그 스크롤
let isGridDragging = false;
let gridStartX = 0;
let gridScrollLeft = 0;
let activeGrid = null;

document.addEventListener('mousedown', (e) => {
    const grid = e.target.closest('.thumbnail-grid');
    if (grid && !['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT', 'LABEL', 'A'].includes(e.target.tagName)) {
        isGridDragging = true;
        activeGrid = grid;
        gridStartX = e.pageX - grid.offsetLeft;
        gridScrollLeft = grid.scrollLeft;
    }
});

document.addEventListener('mouseup', () => {
    isGridDragging = false;
    activeGrid = null;
});

document.addEventListener('mousemove', (e) => {
    if (!isGridDragging || !activeGrid) return;
    const x = e.pageX - activeGrid.offsetLeft;
    const walk = (x - gridStartX) * 1.5;
    activeGrid.scrollLeft = gridScrollLeft - walk;
});

// --------------------------------------------------------------------------
// 6. IndexedDB 오프라인/로컬 영구 저장소 입출력 (openDB, save, load)
// --------------------------------------------------------------------------
function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('FashionMixerDB', 1);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('store')) {
                db.createObjectStore('store');
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function saveStateToIDB() {
    try {
        const db = await openDB();
        const tx = db.transaction('store', 'readwrite');
        const store = tx.objectStore('store');
        store.put(JSON.stringify(CATEGORIES), 'fm_imgs');
        store.put(JSON.stringify(STYLE_SETS), 'fm_sets');
        store.put(JSON.stringify(cylinders.map(c => c.targetRotation)), 'fm_rots');
    } catch (e) {
        console.warn("IndexedDB save error:", e);
    }
}

async function loadStateFromIDB() {
    try {
        const db = await openDB();
        const tx = db.transaction('store', 'readonly');
        const store = tx.objectStore('store');
        const get = (key) => new Promise((res) => {
            const req = store.get(key);
            req.onsuccess = () => res(req.result);
            req.onerror = () => res(null);
        });
        const imgs = await get('fm_imgs');
        const sets = await get('fm_sets');
        const rots = await get('fm_rots');
        return { imgs, sets, rots };
    } catch (e) {
        return null;
    }
}

async function loadEverything() {
    let dataToLoad = { rotations: [] };
    
    // 1. IndexedDB / localStorage 사용자 최근 수정 저장값 로드
    const idbData = await loadStateFromIDB();
    const imgs = idbData?.imgs || localStorage.getItem('fm_imgs');
    const sets = idbData?.sets || localStorage.getItem('fm_sets');
    const rotsStr = idbData?.rots || localStorage.getItem('fm_rots');
    const rots = rotsStr ? (typeof rotsStr === 'string' ? JSON.parse(rotsStr) : rotsStr) : null;

    let loadedImgs = imgs ? (typeof imgs === 'string' ? JSON.parse(imgs) : imgs) : null;
    let loadedSets = sets ? (typeof sets === 'string' ? JSON.parse(sets) : sets) : null;

    // 2. 사용자 수정본이 있으면 그것을 적용하고, 없으면 HTML에 포함된 EMBEDDED_DATA(초기 기본값) 적용
    if (loadedImgs && Array.isArray(loadedImgs) && loadedImgs.length > 0) {
        CATEGORIES = loadedImgs;
    } else if (window.EMBEDDED_DATA && window.EMBEDDED_DATA.categories) {
        CATEGORIES = window.EMBEDDED_DATA.categories;
    }

    if (loadedSets && Array.isArray(loadedSets) && loadedSets.length > 0) {
        STYLE_SETS = loadedSets;
    } else if (window.EMBEDDED_DATA && window.EMBEDDED_DATA.sets) {
        STYLE_SETS = window.EMBEDDED_DATA.sets;
    }

    if (rots && Array.isArray(rots)) {
        dataToLoad.rotations = rots;
    } else if (window.EMBEDDED_DATA && window.EMBEDDED_DATA.rotations) {
        dataToLoad.rotations = window.EMBEDDED_DATA.rotations;
    }
    
    // 원통 텍스처 및 각도 데이터 적용
    const currentRots = dataToLoad.rotations || [];
    for (let i = 0; i < CATEGORIES.length; i++) {
        await updateCylinderTexture(i);
        if (currentRots[i] !== undefined) {
            cylinders[i].targetRotation = currentRots[i];
            cylinders[i].currentAngle = currentRots[i];
            cylinders[i].flatReferenceAngle = currentRots[i];
            cylinders[i].group.rotation.y = currentRots[i];
        }
    }
    
    updateTopCarousel(); 
    createUI();
    updateStorageStatus();
}

// --------------------------------------------------------------------------
// 7. Ease In Out 애니메이션 쿼틱 함수 및 3D <-> 2D 변환 모프 함수
// --------------------------------------------------------------------------
function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function updateCylinderMorphs() {
    const t = easeInOutCubic(flattenProgress);

    cylinders.forEach(c => {
        if (!c.mesh || !c.mesh.geometry || !c.mesh.geometry.userData || !c.mesh.geometry.userData.origPositions) return;
        const geo = c.mesh.geometry;
        const posAttr = geo.attributes.position;
        const normAttr = geo.attributes.normal;
        const uvAttr = geo.attributes.uv;
        const orig = geo.userData.origPositions;
        const flat = geo.userData.flatPositions;
        const origNorm = geo.userData.origNormals;
        const count = posAttr.count;

        for (let i = 0; i < count; i++) {
            const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
            const u = uvAttr ? uvAttr.getX(i) : 0.5;
            const theta = (u - 0.5) * Math.PI * 2;
            
            // 모프 변환 시 자연스러운 종이 곡면 깊이감 형성
            const archFactor = Math.sin(t * Math.PI) * Math.cos(theta * 0.5) * 0.08;

            const x = orig[ix] * (1 - t) + flat[ix] * t;
            const y = orig[iy] * (1 - t) + flat[iy] * t;
            const z = orig[iz] * (1 - t) + flat[iz] * t + archFactor;
            posAttr.setXYZ(i, x, y, z);

            if (normAttr && origNorm) {
                const nx = origNorm[ix] * (1 - t);
                const ny = origNorm[iy] * (1 - t);
                const nz = origNorm[iz] * (1 - t) + 1.0 * t;
                const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1.0;
                normAttr.setXYZ(i, nx / len, ny / len, nz / len);
            }
        }
        posAttr.needsUpdate = true;
        if (normAttr) normAttr.needsUpdate = true;
        if (geo.computeBoundingSphere) geo.computeBoundingSphere();
        if (geo.computeBoundingBox) geo.computeBoundingBox();
    });
}


// --------------------------------------------------------------------------
// 8. 3D/2D 메인 렌더링 프레임 루프 (animate)
// --------------------------------------------------------------------------
function animate() { 
    requestAnimationFrame(animate); 

    // 3D 입체 원통 <-> 2D 펼침 모프 보정 애니메이션
    if (Math.abs(flattenProgress - targetFlattenProgress) > 0.0001) {
        flattenProgress += (targetFlattenProgress - flattenProgress) * 0.08;
        updateCylinderMorphs();
    } else if (flattenProgress !== targetFlattenProgress) {
        flattenProgress = targetFlattenProgress;
        updateCylinderMorphs();
    }

    const t = easeInOutCubic(flattenProgress);

    // 카메라 Z축 거리를 2D/3D 상태 및 줌 배율에 맞춰 보정
    if (camera) {
        currentZoom += (targetZoom - currentZoom) * 0.1;
        const baseCamZ = 3.0 * (1 - t) + 3.2 * t;
        const targetCamZ = baseCamZ * currentZoom;
        camera.position.z += (targetCamZ - camera.position.z) * 0.1;
    }

    // 3D 실린더 자율 회전 (Auto-rotation) 카운트다운 및 처리
    if (pauseAutoDuration > 0) {
        pauseAutoDuration -= 16;
    }

    const isInfoPopupOpen = document.getElementById('info-popup') && document.getElementById('info-popup').style.display === 'flex';
    const canAutoRotate = !isDragging && !isHovering && pauseAutoDuration <= 0 && !isInfoPopupOpen;

    if (canAutoRotate) {
        cylinders.forEach((c) => {
            if (c && c.autoSpeed) {
                c.targetRotation += c.autoSpeed;
            }
        });
    }

    const L = Math.PI * 2 * CYLINDER_RADIUS;

    // 각 카테고리 원통 위치 업데이트
    cylinders.forEach((c) => { 
        if (c.currentAngle === undefined) c.currentAngle = c.group.rotation.y;
        c.currentAngle += (c.targetRotation - c.currentAngle) * 0.12;

        // 2D 펼침 시 크기 비율 확대 (1.05 ~ 1.35)
        const scaleVal = 1.0 * (1 - t) + 1.35 * t;
        c.group.scale.set(scaleVal, scaleVal, scaleVal);

        const rawX = CYLINDER_RADIUS * (c.currentAngle + Math.PI - ROTATION_STEP / 2);
        const scaledL = L * scaleVal;
        const scaledRawX = rawX * scaleVal;

        // 2D 모드 시 무한 가로 스크롤을 위한 X축 Modulo 연산
        let modX = ((scaledRawX % scaledL) + scaledL) % scaledL;
        if (modX > scaledL / 2) modX -= scaledL;

        c.group.rotation.y = c.currentAngle * (1 - t);
        c.group.position.x = modX * t;

        // 2D 모드 확대 시 Y축 높이 비례 조정
        c.group.position.y = (c.baseYPos !== undefined ? c.baseYPos : c.group.position.y) * scaleVal;

        c.mesh.rotation.y = (- (ROTATION_STEP / 2)) * (1 - t);

        if (c.clones) {
            c.clones.forEach(clone => {
                clone.rotation.y = c.mesh.rotation.y;
                clone.visible = t > 0.01;
            });
        }
    }); 
    renderer.render(scene, camera); 
}

// --------------------------------------------------------------------------
// 9. 2D 펼침 View <-> 3D 원통 View 전환 토글 (toggleFlatView)
// --------------------------------------------------------------------------
window.toggleFlatView = function() {
    isFlatView = !isFlatView;
    targetFlattenProgress = isFlatView ? 1 : 0;

    if (isFlatView) {
        cylinders.forEach(c => {
            if (c) {
                c.targetRotation = Math.round((c.targetRotation || 0) / ROTATION_STEP) * ROTATION_STEP;
                c.currentAngle = c.targetRotation;
            }
        });
    }

    const btn = document.getElementById('flat-view-btn');
    if (btn) {
        if (isFlatView) {
            btn.classList.add('active');
            btn.innerText = 'CYLINDER';
        } else {
            btn.classList.remove('active');
            btn.innerText = 'FLAT';
        }
    }
};

// --------------------------------------------------------------------------
// 10. Three.js 원통 3D 메시 및 Canvas 2D 텍스처 매핑 생성 (createCylinderMesh & updateCylinderTexture)
// --------------------------------------------------------------------------
async function createCylinderMesh(index) {
    const h = getCylinderHeight(index); const group = new THREE.Group(); 
    let yPos = 0; 
    const hs = [getCylinderHeight(0), getCylinderHeight(1), getCylinderHeight(2), getCylinderHeight(3), getCylinderHeight(4)];
    const totalH = hs.reduce((a, b) => a + b, 0);
    const top = totalH / 2;
    
    let currentY = top;
    for (let i = 0; i < index; i++) currentY -= hs[i];
    yPos = currentY - h / 2 + 0.05;
    
    group.position.y = yPos;
    
    // 원통 3D 지오메트리 세그먼트 생성 (스탠바이미 및 저전력 GPU 최적화: 96 세그먼트로 매끄러운 곡면 유지 & 버텍스 연산 40% 절감)
    const geo = new THREE.CylinderGeometry(CYLINDER_RADIUS, CYLINDER_RADIUS, h, 96, 1, true);
    
    // 3D 원통 원래 정점 위치와 2D 평면 정점 위치 데이터 구조 저장
    const posAttr = geo.attributes.position;
    const normAttr = geo.attributes.normal;
    const count = posAttr.count;
    const origPositions = new Float32Array(count * 3);
    const flatPositions = new Float32Array(count * 3);
    const origNormals = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        const z = posAttr.getZ(i);
        origPositions[i * 3] = x;
        origPositions[i * 3 + 1] = y;
        origPositions[i * 3 + 2] = z;

        if (normAttr) {
            origNormals[i * 3] = normAttr.getX(i);
            origNormals[i * 3 + 1] = normAttr.getY(i);
            origNormals[i * 3 + 2] = normAttr.getZ(i);
        }
        
        const u = geo.attributes.uv.getX(i);
        const theta = (u - 0.5) * Math.PI * 2;
        flatPositions[i * 3] = CYLINDER_RADIUS * theta;
        flatPositions[i * 3 + 1] = y;
        flatPositions[i * 3 + 2] = 0;
    }
    geo.userData = { origPositions, flatPositions, origNormals };

    // TV/임베디드 GPU(Mali 계열)에 최적화된 MeshStandardMaterial 적용 (투명 간격 지원)
    const mat = new THREE.MeshStandardMaterial({ 
        side: THREE.DoubleSide, 
        roughness: 0.8, 
        metalness: 0.0,
        transparent: true,
        alphaTest: 0.05
    });

    // 원통 틈새 사이로 보이는 뒤쪽/안쪽 면(!gl_FrontFacing)을 어둡게 처리하여 깊이감 및 원근감 연출
    mat.onBeforeCompile = (shader) => {
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <dithering_fragment>',
            `#include <dithering_fragment>
            if (!gl_FrontFacing) {
                gl_FragColor.rgb *= 0.32; // 뒤쪽 안쪽 면 어둡게 쉐이딩 (그림자 효과)
            }
            `
        );
    };

    const L = Math.PI * 2 * CYLINDER_RADIUS;

    const mesh = new THREE.Mesh(geo, mat); 
    mesh.rotation.y = - (ROTATION_STEP / 2); 
    mesh.frustumCulled = false;
    group.add(mesh);

    // 2D 무한 스크롤 연출을 위한 좌우 복제 클론 패널 (-4L ~ +4L)
    const clones = [];
    const offsets = [-4, -3, -2, -1, 1, 2, 3, 4];
    offsets.forEach(mult => {
        const clone = new THREE.Mesh(geo, mat);
        clone.rotation.y = - (ROTATION_STEP / 2);
        clone.position.x = mult * L;
        clone.visible = false;
        clone.frustumCulled = false;
        group.add(clone);
        clones.push(clone);
    });

    const defaultSpeeds = [0.0006, -0.0005, 0.0007, -0.0004, 0.0006];
    const autoSpeed = defaultSpeeds[index % defaultSpeeds.length];
    const obj = { group, mesh, clones, h, baseYPos: yPos, targetRotation: 0, currentAngle: 0, flatReferenceAngle: 0, autoSpeed }; 
    cylinders[index] = obj; return obj;
}

// WebGL 캔버스 오염(Tainted Canvas) 방지 검증 함수
function isImageSafeForCanvas(img) {
    try {
        const testCanvas = document.createElement('canvas');
        testCanvas.width = 1; testCanvas.height = 1;
        const testCtx = testCanvas.getContext('2d');
        testCtx.drawImage(img, 0, 0, 1, 1);
        testCtx.getImageData(0, 0, 1, 1); // 캔버스가 오염된 경우 SecurityError 발생
        return true;
    } catch (e) {
        return false;
    }
}

// 안전한 텍스처용 이미지 로더 (CORS / Data URI / 로컬 이미지 호환)
async function loadCylinderImage(url) {
    if (!url) return null;
    const isDataOrBlob = url.startsWith('data:') || url.startsWith('blob:');
    
    const fetchSingle = (srcUrl, useCrossOrigin) => new Promise((resolve) => {
        const img = new Image();
        if (useCrossOrigin) {
            img.crossOrigin = "anonymous";
        }
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = srcUrl;
    });

    if (isDataOrBlob) {
        return await fetchSingle(url, false);
    }

    // 1차 시도: 일반 CORS 로드
    let loadedImg = await fetchSingle(url, true);
    if (loadedImg) return loadedImg;

    // 2차 시도: 외부 CORS 프록시 경유 로드 (HTTP/HTTPS 인 경우)
    if (url.startsWith('http://') || url.startsWith('https://')) {
        const proxies = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
            `https://corsproxy.io/?${encodeURIComponent(url)}`
        ];
        for (const proxy of proxies) {
            loadedImg = await fetchSingle(proxy, true);
            if (loadedImg) return loadedImg;
        }
    }

    // 3차 시도: crossOrigin 없이 로드 (캔버스 오염을 일으키지 않는 경우만 채택)
    loadedImg = await fetchSingle(url, false);
    if (loadedImg) return loadedImg;

    return null;
}

// 20개 아이템 이미지를 2D Canvas에 베이킹하여 원통 표면 텍스처로 렌더링 (각 칸 간격 분리)
async function updateCylinderTexture(index) {
    let hVal = 7.0; 
    if (index === 0) hVal = 8.5; 
    else if (index === 1) hVal = 5.0; 
    else if (index === 2) hVal = 18.0; 
    else if (index === 3) hVal = 22.0;
    else if (index === 4) hVal = 7.0;
    const hRatio = hVal / 16; 
    const maxTextureCap = (renderer && renderer.capabilities) ? Math.min(4096, renderer.capabilities.maxTextureSize) : 4096;
    const MAX_WIDTH = maxTextureCap; 
    const categoryItems = CATEGORIES[index].items;
    
    const canvas = document.createElement('canvas'); 
    canvas.width = MAX_WIDTH; 
    canvas.height = Math.round((MAX_WIDTH / ITEM_COUNT) * hRatio);
    const ctx = canvas.getContext('2d', { alpha: true }); 
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // 배경은 투명하게 비워 각 칸 사이의 간격을 띄움
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const sW = canvas.width / ITEM_COUNT, sH = canvas.height;
    
    // 전체 카테고리 및 상하/좌우 모든 칸의 떨어진 거리(간격)를 완벽히 통일
    const UNIFORM_GAP = Math.round(sW * 0.08); // 가로/세로 동일한 통합 간격 (약 16px)
    const gapX = UNIFORM_GAP;
    const gapY = UNIFORM_GAP;
    const cardW = sW - gapX;
    const cardH = sH - gapY;
    const cardRadius = 5; // 각 칸 코너 라운드 반경 5
    
    if (categoryItems.length > 0) {
        await Promise.all(Array.from({ length: ITEM_COUNT }).map((_, i) => new Promise(async (res) => {
            const item = categoryItems[i % categoryItems.length];
            if (!item || !item.url) return res();
            const img = await loadCylinderImage(item.url);
            if (img) {
                const cardX = (i * sW) + (gapX / 2);
                const cardY = gapY / 2;

                ctx.save(); 
                ctx.beginPath(); 
                if (ctx.roundRect) {
                    ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
                } else {
                    ctx.rect(cardX, cardY, cardW, cardH);
                }
                
                // 카드 배경 및 클리핑
                ctx.fillStyle = "#ffffff";
                ctx.fill();
                ctx.clip();

                const scale = Math.max(cardW / img.width, cardH / img.height);
                const dW = img.width * scale, dH = img.height * scale;
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, cardX + (cardW - dW)/2, cardY + (cardH - dH)/2, dW, dH); 
                
                ctx.restore();
            }
            res();
        })));
    }
    
    const tex = new THREE.CanvasTexture(canvas); 
    const maxAnisotropy = (renderer && renderer.capabilities) ? renderer.capabilities.getMaxAnisotropy() : 8;
    tex.anisotropy = Math.min(8, maxAnisotropy);
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    
    cylinders[index].mesh.material.map = tex; 
    cylinders[index].mesh.material.needsUpdate = true;
    if (cylinders[index].clones) {
        cylinders[index].clones.forEach(clone => {
            clone.material.map = tex;
            clone.material.needsUpdate = true;
        });
    }
}

// --------------------------------------------------------------------------
// 11. 마우스/터치 인터랙션 이벤트 핸들러 (PointerDown, Move, Up, Click)
// --------------------------------------------------------------------------
function onPointerDown(e) {
    if (document.getElementById('info-popup') && document.getElementById('info-popup').style.display === 'flex') {
        return;
    }
    if (e.target.closest('#management-panel, #side-style-wrapper, #instruction-overlay, #info-popup, .controls, #audio-control-btn, .ui-overlay, #management-btn-wrapper')) {
        return;
    }
    pointerStartTime = Date.now(); pointerStartPos = { x: e.clientX, y: e.clientY };
    const m = new THREE.Vector2((e.clientX/innerWidth)*2-1, -(e.clientY/innerHeight)*2+1);
    const r = new THREE.Raycaster(); r.setFromCamera(m, camera); const h = r.intersectObjects(scene.children, true);
    if (h.length) {
        let o = h[0].object; while(o.parent && !scene.children.includes(o)) o = o.parent;
        activeCylinderIndex = cylinders.findIndex(c => c.group === o);
        if (activeCylinderIndex !== -1) { 
            isDragging = true; 
            pauseAutoDuration = 5000;
            dragStartX = e.clientX; 
            dragStartRotation = cylinders[activeCylinderIndex].targetRotation; 
            dragStartRotations = cylinders.map(c => c ? c.targetRotation : 0);
        }
    }
}

function getAllInteractableMeshes() {
    const list = [];
    cylinders.forEach(c => {
        if (c.mesh) list.push(c.mesh);
        if (c.clones) {
            c.clones.forEach(clone => {
                if (clone.visible) list.push(clone);
            });
        }
    });
    return list;
}

function findCategoryIndexByMesh(mesh) {
    return cylinders.findIndex(c => c.mesh === mesh || (c.clones && c.clones.includes(mesh)));
}

function onPointerMove(e) { 
    if (e.target.closest('#management-panel, #side-style-wrapper, #instruction-overlay, #info-popup, .controls, #audio-control-btn, .ui-overlay, #management-btn-wrapper')) {
        isHovering = false; 
        hoveredCylinderIndex = -1;
        document.body.style.cursor = 'default';
        return;
    }
    const m = new THREE.Vector2((e.clientX/innerWidth)*2-1, -(e.clientY/innerHeight)*2+1);
    const r = new THREE.Raycaster(); r.setFromCamera(m, camera);
    const intersects = r.intersectObjects(getAllInteractableMeshes());
    
    if (intersects.length > 0) {
        isHovering = true; const catId = findCategoryIndexByMesh(intersects[0].object);
        hoveredCylinderIndex = catId;
        document.body.style.cursor = 'default';
    } else { 
        isHovering = false; 
        hoveredCylinderIndex = -1;
        document.body.style.cursor = 'default'; 
    }
    
    if (isDragging && activeCylinderIndex !== -1) { 
        const sensitivity = isFlatView ? 0.0035 : 0.004;
        const deltaX = e.clientX - dragStartX;
        const deltaRot = deltaX * sensitivity;

        // 클릭하여 드래그한 카테고리만 독립 회전
        cylinders[activeCylinderIndex].targetRotation = dragStartRotation + deltaRot; 
        document.body.style.cursor = 'default'; 
    }
}

function onPointerUp(e) {
    if (e.target.closest('#management-panel, #side-style-wrapper, #instruction-overlay, #info-popup, .controls, #audio-control-btn, .ui-overlay, #management-btn-wrapper')) {
        isDragging = false;
        return;
    }
    const dist = Math.hypot(e.clientX - pointerStartPos.x, e.clientY - pointerStartPos.y);
    if ((Date.now() - pointerStartTime) < 250 && dist < 5 && activeCylinderIndex !== -1) handleCylinderClick(e);
    isDragging = false; 
    pauseAutoDuration = 5000;
    if (activeCylinderIndex !== -1) { 
        cylinders[activeCylinderIndex].targetRotation = Math.round(cylinders[activeCylinderIndex].targetRotation / ROTATION_STEP) * ROTATION_STEP; 
        saveState(); 
    }
}

// 아이템 클릭 시 팝업 띄우기
function handleCylinderClick(e) {
    const m = new THREE.Vector2((e.clientX/innerWidth)*2-1, -(e.clientY/innerHeight)*2+1);
    const r = new THREE.Raycaster(); r.setFromCamera(m, camera);
    const intersects = r.intersectObjects(getAllInteractableMeshes());
    if (intersects.length > 0) {
        const catId = findCategoryIndexByMesh(intersects[0].object);
        const rawUvIdx = Math.floor(intersects[0].uv.x * ITEM_COUNT);
        const items = CATEGORIES[catId]?.items || [];
        const uvIdx = items.length > 0 ? rawUvIdx % items.length : rawUvIdx;
        if (catId !== -1 && items[uvIdx]) showInfoPopup(catId, uvIdx);
    }
}

// --------------------------------------------------------------------------
// 12. 좌측 수직 스타일 선택 휠 UI 업데이트 및 드래그/스크롤 제어
// --------------------------------------------------------------------------
window.switchArchiveTab = (tabName) => {
    const catContent = document.getElementById('tab-content-category');
    const setContent = document.getElementById('tab-content-styleset');
    const catBtn = document.getElementById('tab-btn-category');
    const setBtn = document.getElementById('tab-btn-styleset');
    
    if (tabName === 'category') {
        if (catContent) catContent.style.display = 'block';
        if (setContent) setContent.style.display = 'none';
        if (catBtn) catBtn.classList.add('active');
        if (setBtn) setBtn.classList.remove('active');
    } else {
        if (catContent) catContent.style.display = 'none';
        if (setContent) setContent.style.display = 'block';
        if (catBtn) catBtn.classList.remove('active');
        if (setBtn) setBtn.classList.add('active');
    }
};

window.togglePanel = (e) => { 
    if (e && e.stopPropagation) e.stopPropagation(); 
    const p = document.getElementById('management-panel'); 
    if (p.style.display !== 'block') {
        createUI();
        p.style.display = 'block';
    } else {
        p.style.display = 'none';
        pauseAutoDuration = 0;
        isHovering = false;
    }
};
window.addEventListener('pointerdown', (e) => {
    const p = document.getElementById('management-panel');
    if (p && p.style.display === 'block') {
        if (!e.target.closest('#management-panel') && !e.target.closest('#management-btn-wrapper') && !e.target.closest('[onclick*="togglePanel"]')) {
            p.style.display = 'none';
            pauseAutoDuration = 0;
            isHovering = false;
        }
    }
    const infoPopup = document.getElementById('info-popup');
    if (infoPopup && (infoPopup.style.display === 'flex' || infoPopup.style.display === 'block')) {
        if (!e.target.closest('.info-card')) {
            closeInfoPopup();
        }
    }
    const instOverlay = document.getElementById('instruction-overlay');
    if (instOverlay && (instOverlay.style.display === 'flex' || instOverlay.style.display === 'block')) {
        if (!e.target.closest('.instruction-card')) {
            closeInstructions();
        }
    }
});
window.updateTopCarousel = () => { 
    const container = document.getElementById('side-style-container');
    const list = document.getElementById('side-style-list');
    if (!container || !list) return;

    if (!STYLE_SETS || STYLE_SETS.length === 0) {
        list.innerHTML = '';
        return;
    }

    const baseHTML = STYLE_SETS.map((s, idx) => `
        <div class="side-style-item" 
             data-id="${s.id}" data-idx="${idx}">
            ${s.name}
        </div>`).join(''); 
    
    const copies = 50;
    list.innerHTML = baseHTML.repeat(copies);
    
    if (!container.dataset.scrollInited) {
        container.dataset.scrollInited = "true";
        container.addEventListener('scroll', () => {
            if (!STYLE_SETS.length) return;
            const itemHeight = list.children[0]?.offsetHeight || 0;
            const gap = 12; 
            const groupHeight = (itemHeight + gap) * STYLE_SETS.length;
            const middleScroll = groupHeight * Math.floor(copies / 2);
            
            if (container.scrollTop < groupHeight * 5 || container.scrollTop > groupHeight * (copies - 5)) {
                const currentOffsetInGroup = container.scrollTop % groupHeight;
                container.scrollTop = middleScroll + currentOffsetInGroup;
            }
            
            updateActiveSideStyle();
        }, { passive: true });
    }

    setTimeout(() => {
        let activeIdx = STYLE_SETS.findIndex(s => s.id === editingSetId);
        if (activeIdx === -1) activeIdx = 0;
        
        const middleBaseIdx = STYLE_SETS.length * Math.floor(copies / 2);
        const targetItem = list.children[middleBaseIdx + activeIdx];
        
        if (targetItem) {
            const itemCenter = targetItem.offsetTop + targetItem.offsetHeight / 2;
            container.scrollTop = itemCenter - container.clientHeight / 2;
        }
        
        updateActiveSideStyle();
    }, 10);

    initSideWheelDrag();
};

window.scrollToSetIndex = (idx) => {
    const container = document.getElementById('side-style-container');
    const items = container ? container.querySelectorAll('.side-style-item') : null;
    if (items && items[idx]) {
        items[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
};

let isSideWheelDragging = false;
let sideWheelStartY = 0;
let sideWheelStartScrollTop = 0;
let isSideWheelDragMoved = false;

function initSideWheelDrag() {
    const container = document.getElementById('side-style-container');
    if (!container || container.dataset.dragInited) return;
    container.dataset.dragInited = "true";

    // Use capture phase to prevent click on dragged items
    container.addEventListener('click', (e) => {
        if (isSideWheelDragMoved) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        const item = e.target.closest('.side-style-item');
        if (item) {
            const setId = parseInt(item.getAttribute('data-id'), 10);
            if (!isNaN(setId)) {
                window.applyStyleSet(setId);
                item.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, true);

    container.addEventListener('pointerdown', (e) => {
        isSideWheelDragging = true;
        isSideWheelDragMoved = false;
        sideWheelStartY = e.clientY;
        sideWheelStartScrollTop = container.scrollTop;
        container.style.cursor = 'grabbing';
        // Disable scroll snap while dragging for smooth movement
        container.style.scrollSnapType = 'none';
    });

    window.addEventListener('pointermove', (e) => {
        if (!isSideWheelDragging) return;
        const deltaY = e.clientY - sideWheelStartY;
        if (Math.abs(deltaY) > 5) {
            isSideWheelDragMoved = true;
        }
        container.scrollTop = sideWheelStartScrollTop - deltaY;
    });

    const endDrag = (e) => {
        if (!isSideWheelDragging) return;
        isSideWheelDragging = false;
        container.style.cursor = 'grab';
        
        // Re-enable scroll snap
        container.style.scrollSnapType = 'y mandatory';

        if (isSideWheelDragMoved) {
            updateActiveSideStyle();
            const activeItem = container.querySelector('.side-style-item.active');
            if (activeItem) {
                const setId = parseInt(activeItem.getAttribute('data-id'), 10);
                if (!isNaN(setId)) {
                    window.applyStyleSet(setId);
                }
            }
        }
    };

    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
}


function updateActiveSideStyle() {
    const container = document.getElementById('side-style-container');
    const items = container.querySelectorAll('.side-style-item');
    if (!items.length) return;
    
    const containerCenter = container.getBoundingClientRect().top + container.clientHeight / 2;
    let closestItem = null;
    let minDistance = Infinity;
    
    items.forEach(item => {
        const itemCenter = item.getBoundingClientRect().top + item.clientHeight / 2;
        const distance = Math.abs(containerCenter - itemCenter);
        if (distance < minDistance) {
            minDistance = distance;
            closestItem = item;
        }
    });
    
    items.forEach(item => item.classList.remove('active'));
    if (closestItem) {
        closestItem.classList.add('active');
    }
}

// --------------------------------------------------------------------------
// 13. 이미지 압축 및 업로드 처리 (resizeImage & handleFileUpload)
// --------------------------------------------------------------------------
async function resizeImage(dataUrl, maxW = 1280, quality = 0.85) {
    return new Promise((res) => {
        const img = new Image(); img.onload = () => {
            const canvas = document.createElement('canvas'); 
            const scale = Math.min(1, maxW / Math.max(img.width, img.height));
            canvas.width = img.width * scale; canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d'); 
            ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            res(canvas.toDataURL('image/jpeg', quality));
        }; img.src = dataUrl;
    });
}

window.handleFileUpload = async (e, id) => {
    const files = Array.from(e.target.files); if (!files.length) return;
    const catIdx = CATEGORIES.findIndex(c => c.id === id); if (catIdx === -1) return;

    // 카테고리별 최대 20장 제한 확인
    if (CATEGORIES[catIdx].items.length >= ITEM_COUNT) {
        showMessage(`⚠️ ${CATEGORIES[catIdx].name} 카테고리는 이미 가득 찼습니다. (최대 ${ITEM_COUNT}장)`);
        e.target.value = "";
        return;
    }

    showMessage("100장 수용 모드: 초고밀도 압축 중...");
    try {
        const urls = await Promise.all(files.map(async f => {
            const rawUrl = await new Promise(res => { const rd = new FileReader(); rd.onload = ev => res(ev.target.result); rd.readAsDataURL(f); });
            return await resizeImage(rawUrl, 480);
        }));
        CATEGORIES[catIdx].items = [...urls.map(u => ({url:u, setIds:[]})), ...CATEGORIES[catIdx].items].slice(0, ITEM_COUNT);
        await updateCylinderTexture(catIdx); saveState(); createUI(); showMessage("최적화 업로드 완료! (100장 준비 완료) ✨");
    } catch (err) { console.error(err); showMessage("업로드 실패: 용량을 확인해 주세요."); }
};

// --------------------------------------------------------------------------
// 14. 갤러리 썸네일 삭제 / 순서 이동 / Drag and Drop (deleteImage, moveImageOrder, handleDrop)
// --------------------------------------------------------------------------
window.deleteImage = async (catId, idx) => {
    const panel = document.getElementById('management-panel');
    const panelScroll = panel.scrollTop;
    
    const grids = document.querySelectorAll('.thumbnail-grid');
    const gridIdx = CATEGORIES.findIndex(c => c.id === catId);
    const horizontalScroll = (gridIdx !== -1 && grids[gridIdx]) ? grids[gridIdx].scrollLeft : 0;

    CATEGORIES[catId].items.splice(idx, 1);
    await updateCylinderTexture(catId);
    saveState();
    createUI();
    
    panel.scrollTop = panelScroll;
    const newGrids = document.querySelectorAll('.thumbnail-grid');
    if (gridIdx !== -1 && newGrids[gridIdx]) {
        newGrids[gridIdx].scrollLeft = horizontalScroll;
    }
};

window.moveImageOrder = async (catId, idx, dir) => {
    const targetIdx = idx + dir;
    const catIdx = CATEGORIES.findIndex(c => c.id === catId);
    if (catIdx === -1) return;
    const items = CATEGORIES[catIdx].items;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const panel = document.getElementById('management-panel');
    const pScroll = panel.scrollTop;
    const grids = document.querySelectorAll('.thumbnail-grid');
    const hScroll = (catIdx !== -1 && grids[catIdx]) ? grids[catIdx].scrollLeft : 0;

    const temp = items[idx];
    items[idx] = items[targetIdx];
    items[targetIdx] = temp;

    await updateCylinderTexture(catId);
    saveState();
    createUI();

    panel.scrollTop = pScroll;
    const newG = document.querySelectorAll('.thumbnail-grid');
    if (catIdx !== -1 && newG[catIdx]) newG[catIdx].scrollLeft = hScroll;
};

window.handleDragStart = (e, catId, idx) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ catId, idx }));
    e.currentTarget.classList.add('dragging');
};
window.handleDragOver = (e) => e.preventDefault();
window.handleDragEnter = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
};
window.handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
};
window.handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.thumb-container').forEach(el => el.classList.remove('drag-over', 'dragging'));
};
window.handleDrop = async (e, targetCatId, targetIdx) => {
    e.preventDefault();
    document.querySelectorAll('.thumb-container').forEach(el => el.classList.remove('drag-over', 'dragging'));
    
    let data;
    try {
        data = JSON.parse(e.dataTransfer.getData('text/plain'));
    } catch(err) { return; }
    
    const sourceCatId = data.catId; 
    const sourceIdx = data.idx;
    if (sourceCatId !== targetCatId || sourceIdx === targetIdx) return;
    
    const panel = document.getElementById('management-panel'); 
    const pScroll = panel.scrollTop;
    const grids = document.querySelectorAll('.thumbnail-grid'); 
    const gIdx = CATEGORIES.findIndex(c => c.id === targetCatId);
    const hScroll = (gIdx !== -1 && grids[gIdx]) ? grids[gIdx].scrollLeft : 0;

    const items = CATEGORIES[targetCatId].items; 
    const [moved] = items.splice(sourceIdx, 1); 
    items.splice(targetIdx, 0, moved);

    await updateCylinderTexture(targetCatId); 
    saveState(); 
    createUI();

    panel.scrollTop = pScroll; 
    const newG = document.querySelectorAll('.thumbnail-grid');
    if (gIdx !== -1 && newG[gIdx]) newG[gIdx].scrollLeft = hScroll;
};

// --------------------------------------------------------------------------
// 15. 스타일 세트(Lookbook) 정렬, 할당 및 번들링 내보내기 (alignToSet, saveToShareableFile)
// --------------------------------------------------------------------------
window.uploadSetReferenceImage = async (setId, e) => {
    const file = e.target.files[0]; if (!file) return;
    showMessage("스타일 대표 이미지 압축 중...");
    try {
        const raw = await new Promise(res => { const rd = new FileReader(); rd.onload = ev => res(ev.target.result); rd.readAsDataURL(file); });
        const optimized = await resizeImage(raw, 1920, 0.92);
        const set = STYLE_SETS.find(s => s.id === setId);
        if (set) { 
            set.repUrl = optimized; 
            set.updatedAt = Date.now();
            saveState(); 
            createUI(); 
            showMessage("스타일 화보 등록 완료! ✨"); 
        }
    } catch (err) { 
        console.error(err); 
        showMessage("업로드 오류"); 
    } finally {
        if (e && e.target) e.target.value = "";
    }
};

window.showSetReference = () => {
    if (!editingSetId) { showMessage("먼저 상단에서 스타일을 선택해 주세요."); return; }
    const set = STYLE_SETS.find(s => s.id === editingSetId);
    if (!set || !set.repUrl) { showMessage("이 스타일의 대표 이미지가 등록되지 않았습니다."); return; }
    
    document.getElementById('info-img').src = set.repUrl;
    document.getElementById('info-category').innerText = "STYLE CONCEPT";
    document.getElementById('info-title').innerText = set.name;
    document.getElementById('info-desc').innerText = "이 스타일 조합에 대한 오피셜 룩북 이미지입니다.";
    const linkBtn = document.getElementById('info-link');
    const imgLink = document.getElementById('info-img-link');
    const buyOverlay = document.getElementById('info-buy-overlay');
    if (linkBtn) linkBtn.style.display = 'none';
    if (imgLink) { imgLink.removeAttribute('href'); imgLink.style.pointerEvents = 'none'; }
    if (buyOverlay) buyOverlay.style.display = 'none';
    document.getElementById('info-popup').style.display = 'flex';
};

window.showSetThumbnailPreview = (setId) => {
    const set = STYLE_SETS.find(s => s.id === setId);
    if (!set || !set.repUrl) return;
    
    document.getElementById('info-img').src = set.repUrl;
    document.getElementById('info-category').innerText = "STYLE LOOKBOOK";
    document.getElementById('info-title').innerText = set.name;
    document.getElementById('info-desc').innerText = "이 스타일 조합에 대한 오피셜 룩북 이미지입니다.";
    const linkBtn = document.getElementById('info-link');
    const imgLink = document.getElementById('info-img-link');
    const buyOverlay = document.getElementById('info-buy-overlay');
    if (linkBtn) linkBtn.style.display = 'none';
    if (imgLink) { imgLink.removeAttribute('href'); imgLink.style.pointerEvents = 'none'; }
    if (buyOverlay) buyOverlay.style.display = 'none';
    document.getElementById('info-popup').style.display = 'flex';
};

window.handleSetDragStart = (e, idx) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'set', idx }));
    e.target.classList.add('opacity-40');
};
window.handleSetDragEnd = (e) => {
    document.querySelectorAll('.set-item-row').forEach(el => el.classList.remove('opacity-40'));
};
window.handleSetDragOver = (e) => e.preventDefault();
window.handleSetDrop = (e, targetIdx) => {
    e.preventDefault();
    document.querySelectorAll('.set-item-row').forEach(el => el.classList.remove('opacity-40'));
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (data.type !== 'set' || data.idx === targetIdx) return;
    const [moved] = STYLE_SETS.splice(data.idx, 1);
    STYLE_SETS.splice(targetIdx, 0, moved);
    saveState(); createUI(); showMessage("세트 순서 변경 완료! ✨");
};

// --------------------------------------------------------------------------
// 16. 관리 패널 HTML 동적 생성 함수 (createUI)
// --------------------------------------------------------------------------
function createUI() {
    document.getElementById('category-controls').innerHTML = CATEGORIES.map(cat => {
        const curRot = (window.cylinders && window.cylinders[cat.id]) ? (window.cylinders[cat.id].targetRotation || 0) : 0;
        const activeIndex = ((Math.round(-curRot / ROTATION_STEP) % ITEM_COUNT) + ITEM_COUNT) % ITEM_COUNT;

        return `
        <div class="category-section">
            <div class="category-header">
                <div class="category-title">${cat.name}</div>
                <label class="category-add-btn" title="이미지 추가 (+)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    <input type="file" multiple class="hidden" onchange="handleFileUpload(event, ${cat.id})">
                </label>
            </div>
            <div class="thumbnail-grid">${cat.items.map((item, i) => {
                const isActive = (i === activeIndex);
                return `
                <div class="thumb-container ${isActive ? 'is-active' : ''}" draggable="true" 
                     ondragstart="handleDragStart(event, ${cat.id}, ${i})" 
                     ondragover="handleDragOver(event)" 
                     ondragenter="handleDragEnter(event)"
                     ondragleave="handleDragLeave(event)"
                     ondragend="handleDragEnd(event)"
                     ondrop="handleDrop(event, ${cat.id}, ${i})">
                    <div class="thumb" onclick="showInfoPopup(${cat.id}, ${i})"><img src="${item.url}"></div>
                    <div class="delete-btn" onclick="deleteImage(${cat.id}, ${i})" title="삭제">×</div>
                    <div class="item-inputs-stack">
                        <select class="set-assigner ${item.setIds && item.setIds.length > 0 ? 'has-set' : ''}" onchange="assignSetForItem(${cat.id}, ${i}, this.value)" title="세트 지정">
                            <option value="">NO SET</option>
                            ${STYLE_SETS.map(s => `
                                <option value="${s.id}" ${item.setIds?.includes(s.id) ? 'selected' : ''}>${s.name}</option>
                            `).join('')}
                        </select>
                        <input type="text" class="item-title" onchange="updateItemTitle(${cat.id}, ${i}, this.value)" placeholder="NAME" value="${item.title || ''}">
                        <input type="text" class="item-memo" onchange="updateItemMemo(${cat.id}, ${i}, this.value)" placeholder="DESC" value="${item.desc || ''}">
                        <input type="text" class="item-link-input" onchange="updateItemLink(${cat.id}, ${i}, this.value)" placeholder="URL" value="${item.link || ''}">
                    </div>
                    <div class="order-btn-group">
                        <button class="order-btn" onclick="event.stopPropagation(); moveImageOrder(${cat.id}, ${i}, -1)" title="왼쪽으로 이동" ${i === 0 ? 'disabled style="opacity:0.2;cursor:default;"' : ''}>◀</button>
                        <span class="order-idx">${i + 1}</span>
                        <button class="order-btn" onclick="event.stopPropagation(); moveImageOrder(${cat.id}, ${i}, 1)" title="오른쪽으로 이동" ${i === cat.items.length - 1 ? 'disabled style="opacity:0.2;cursor:default;"' : ''}>▶</button>
                    </div>
                    <div class="item-active-indicator ${isActive ? '' : 'invisible'}"></div>
                </div>`;
            }).join('')}</div>
        </div>`;
    }).join('');

    document.getElementById('set-settings-list').innerHTML = STYLE_SETS.map((s, i) => `
        <div class="set-item-row" draggable="true" 
             ondragstart="handleSetDragStart(event, ${i})" 
             ondragend="handleSetDragEnd(event)" 
             ondragover="handleSetDragOver(event)" 
             ondrop="handleSetDrop(event, ${i})">
            <div class="set-thumb-preview ${s.repUrl ? 'has-img' : ''}" 
                 onclick="${s.repUrl ? `showSetThumbnailPreview(${s.id})` : ''}" 
                 title="${s.repUrl ? '룩북 이미지 크게 보기' : '이미지 없음'}">
                ${s.repUrl ? `<img src="${s.repUrl}" alt="${s.name}">` : `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                `}
            </div>
            <div class="flex flex-col justify-between self-stretch py-1 gap-2 flex-1 min-w-0">
                <div>
                    <input type="text" value="${s.name}" onchange="renameStyleSet(${s.id}, this.value)" class="set-name-edit" placeholder="STYLE NAME">
                    <div class="text-[10px] font-bold mt-1 ${s.repUrl ? 'text-indigo-600' : 'text-slate-400'}">
                        ${s.repUrl ? '● 이미지 등록됨' : '○ 이미지 없음'}
                    </div>
                </div>
                <div class="set-action-btns">
                    <label class="set-mini-btn btn-image-upload ${s.repUrl ? 'has-img' : ''}" title="스타일 대표 화보 이미지 선택/변경">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        <input type="file" accept="image/*" class="hidden" onchange="uploadSetReferenceImage(${s.id}, event)">
                    </label>
                    <button onclick="deleteStyleSet(${s.id})" class="set-mini-btn btn-delete" title="스타일 세트 삭제">DEL</button>
                </div>
            </div>
        </div>`).join('');
    updateTopCarousel();
}

// 5개 원통을 특정 스타일 세트 아이템에 맞춰 동시 정렬하는 기능
window.alignToSet = (setId) => {
    if (!CATEGORIES || !cylinders || cylinders.length === 0) return;
    
    lastInteractionTime = Date.now(); 
    pauseAutoDuration = 10000; 

    const numSetId = Number(setId);

    for (let c = 0; c < cylinders.length; c++) {
        if (!CATEGORIES[c] || !CATEGORIES[c].items) continue;

        const idx = CATEGORIES[c].items.findIndex(item => item && item.setIds && item.setIds.map(Number).includes(numSetId));
        const cur = cylinders[c].targetRotation !== undefined ? cylinders[c].targetRotation : (cylinders[c].currentAngle || 0);
        
        let targetIdx = idx;
        if (targetIdx === -1) {
            targetIdx = ((Math.round(-cur / ROTATION_STEP) % ITEM_COUNT) + ITEM_COUNT) % ITEM_COUNT;
        }

        const baseTarget = - targetIdx * ROTATION_STEP;
        let diff = baseTarget - cur;
        diff = ((diff % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
        cylinders[c].targetRotation = cur + diff;
    }
    if(typeof saveState === "function") saveState(); 
    document.querySelectorAll('.side-style-item').forEach(btn => {
        btn.classList.toggle('active', Number(btn.getAttribute('data-id')) === numSetId);
    });
};

window.applyStyleSet = (id, element) => { 
    editingSetId = id; 
    window.alignToSet(id); 
    if (element && typeof element.scrollIntoView === 'function') { 
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } 
    if (typeof showSetReference === 'function') {
        showSetReference();
    }
};
window.addStyleSet = () => { const id = STYLE_SETS.length > 0 ? Math.max(...STYLE_SETS.map(s => s.id)) + 1 : 1; STYLE_SETS.push({ id, name: "NAME" }); saveState(); createUI(); };
window.assignSetForItem = (catId, idx, setIdStr) => {
    const item = CATEGORIES[catId].items[idx];
    if (!item.setIds) item.setIds = [];
    
    if (!setIdStr) {
        item.setIds = [];
    } else {
        const setId = parseInt(setIdStr, 10);
        CATEGORIES[catId].items.forEach(it => {
            if (it.setIds) {
                it.setIds = it.setIds.filter(id => id !== setId);
            }
        });
        item.setIds = [setId];
    }
    if (typeof saveState === 'function') saveState(); 
    createUI();
};
window.renameStyleSet = (id, n) => { const s = STYLE_SETS.find(x => x.id === id); if(s) { s.name = n.toUpperCase(); saveState(); createUI(); } };
window.saveCurrentToSet = (id) => { cylinders.forEach((cyl, catIdx) => { const raw = Math.round(-cyl.targetRotation / ROTATION_STEP); const fIdx = ((raw % ITEM_COUNT) + ITEM_COUNT) % ITEM_COUNT; CATEGORIES[catIdx].items.forEach(it => { if (it && it.setIds) it.setIds = it.setIds.filter(setId => setId !== id); }); const it = CATEGORIES[catIdx].items[fIdx]; if(it) { if(!it.setIds) it.setIds = []; it.setIds.push(id); } }); editingSetId = id; saveState(); createUI(); showMessage("현재 착장이 스타일 세트에 저장되었습니다! ✨"); };

// 전 데이터 및 이미지를 단일 HTML 파일로 번들링하여 다운로드
window.saveToShareableFile = async () => {
    showMessage("Fashion Rewinder 전시용 파일 생성 중... (이미지 번들링)");
    try {
        const imageUrlToDataURL = (url) => {
            if (!url) return Promise.resolve(url);
            if (url.startsWith('data:')) return Promise.resolve(url);
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth || img.width || 480;
                        canvas.height = img.naturalHeight || img.height || 480;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        resolve(canvas.toDataURL('image/png'));
                    } catch (e) {
                        console.warn("Canvas toDataURL failed:", e);
                        resolve(url);
                    }
                };
                img.onerror = () => resolve(url);
                img.src = url;
            });
        };

        const bundledCategories = await Promise.all(CATEGORIES.map(async (cat) => {
            const bundledItems = await Promise.all(cat.items.map(async (item) => {
                const dataUrl = await imageUrlToDataURL(item.url);
                return { ...item, url: dataUrl };
            }));
            return { ...cat, items: bundledItems };
        }));

        const sessionData = { 
            categories: bundledCategories, 
            sets: STYLE_SETS, 
            rotations: cylinders.map(c => c.targetRotation)
        };

        const catContainer = document.getElementById('category-controls');
        const setListContainer = document.getElementById('set-settings-list');
        const canvasContainer = document.getElementById('canvas-container');
        
        const backupCat = catContainer ? catContainer.innerHTML : '';
        const backupSetList = setListContainer ? setListContainer.innerHTML : '';
        const backupCanvas = canvasContainer ? canvasContainer.innerHTML : '';
        
        if (catContainer) catContainer.innerHTML = '';
        if (setListContainer) setListContainer.innerHTML = '';
        if (canvasContainer) canvasContainer.innerHTML = '';

        let html = document.documentElement.outerHTML; 

        if (catContainer) catContainer.innerHTML = backupCat;
        if (setListContainer) setListContainer.innerHTML = backupSetList;
        if (canvasContainer) canvasContainer.innerHTML = backupCanvas;

        // 3. 기존 EMBEDDED_DATA 스크립트 제거
        html = html.replace(/<script>\s*window\.EMBEDDED_DATA\s*=\s*[\s\S]*?<\/script>/gi, ""); 

        // 4. 스플래쉬(로더) 화면 복원 (시작 시 스플래쉬 로딩 화면이 정상 출력되도록)
        html = html.replace(/<div id="loading-screen"[\s\S]*?>/, '<div id="loading-screen">');

        // 5. 전시 안내(Guide) 오버레이 복원
        html = html.replace(/<div id="instruction-overlay"[\s\S]*?>/, '<div id="instruction-overlay" onclick="if(event.target === this) closeInstructions()">');

        // 6. GALLERY 관리자 패널(management-panel) 닫힌 상태로 복원
        html = html.replace(/<div id="management-panel"[\s\S]*?>/, '<div id="management-panel" class="" style="display: none;">');

        // 7. 토스트 메세지 팝업박스 및 정보 팝업 초기화 (내보내기 토스트 팝업 텍스트 제거)
        html = html.replace(/<div id="message-box"[\s\S]*?<\/div>/, '<div id="message-box"></div>');
        html = html.replace(/<div id="info-popup"[\s\S]*?>/, '<div id="info-popup" style="display: none;" onclick="if(event.target === this) closeInfoPopup()">');
        
        const escapedData = JSON.stringify(sessionData).replace(/</g, '\\u003c');
        const dataScript = `\n<script>window.EMBEDDED_DATA = ${escapedData};<\/script>\n`;

        if (html.includes("</body>")) {
            html = html.replace("</body>", dataScript + "</body>");
        } else {
            html += dataScript;
        }
        
        const blob = new Blob([html], { type: 'text/html' }); 
        const url = URL.createObjectURL(blob); 
        const a = document.createElement('a'); 
        a.href = url; 
        a.download = `Fashion_Rewinder_Exhibition_FULL.html`; 
        a.click();
        showMessage("✅ 내보내기 완료!");
    } catch (err) { 
        console.error(err);
        showMessage("❌ 번들링 실패"); 
    }
};

window.deleteStyleSet = (id) => { if(STYLE_SETS.length <= 1) return; STYLE_SETS = STYLE_SETS.filter(x => x.id !== id); saveState(); createUI(); };

function saveState() { 
    if (isLocked) return; 
    saveStateToIDB(); 
    if (window.EMBEDDED_DATA) {
        window.EMBEDDED_DATA.categories = CATEGORIES;
        window.EMBEDDED_DATA.sets = STYLE_SETS;
        window.EMBEDDED_DATA.rotations = cylinders.map(c => c ? c.targetRotation : 0);
    }
    try { 
        localStorage.setItem('fm_sets', JSON.stringify(STYLE_SETS)); 
    } catch (e) {
        console.warn("LocalStorage save error for fm_sets:", e);
    }
    try { 
        localStorage.setItem('fm_rots', JSON.stringify(cylinders.map(c => c ? c.targetRotation : 0))); 
    } catch (e) {
        console.warn("LocalStorage save error for fm_rots:", e);
    }
    try { 
        localStorage.setItem('fm_imgs', JSON.stringify(CATEGORIES)); 
    } catch (e) { 
        console.warn("LocalStorage quota exceeded for fm_imgs, relying on IndexedDB:", e); 
    } 
}

// --------------------------------------------------------------------------
// 17. 아이템 정보 팝업 모달 & 무작위/리셋 컨트롤 (showInfoPopup, randomize, resetRotation)
// --------------------------------------------------------------------------
window.showInfoPopup = (catId, idx) => { 
    const it = CATEGORIES[catId].items[idx]; 
    if (!it) return; 
    document.getElementById('info-img').src = it.url; 
    document.getElementById('info-category').innerText = CATEGORIES[catId].name; 
    document.getElementById('info-title').innerText = it.title || "ITEM"; 
    document.getElementById('info-desc').innerText = it.desc || "상세 정보 없음"; 
    
    const linkBtn = document.getElementById('info-link');
    const imgLink = document.getElementById('info-img-link');
    const buyOverlay = document.getElementById('info-buy-overlay');
    
    if (it.link) {
        linkBtn.href = it.link;
        linkBtn.style.display = 'inline-block';
        imgLink.href = it.link;
        imgLink.style.pointerEvents = 'auto';
        buyOverlay.style.display = 'flex';
    } else {
        linkBtn.style.display = 'none';
        imgLink.removeAttribute('href');
        imgLink.style.pointerEvents = 'none';
        buyOverlay.style.display = 'none';
    }
    
    document.getElementById('info-popup').style.display = 'flex'; 
};
window.closeInfoPopup = () => {
    document.getElementById('info-popup').style.display = 'none';
    lastInteractionTime = Date.now();
    pauseAutoDuration = 0;
    isHovering = false;
    isDragging = false;
};
window.randomize = () => { 
    lastInteractionTime = Date.now(); 
    pauseAutoDuration = 5000; 
    cylinders.forEach((c, cIdx) => {
        const itemCount = (CATEGORIES[cIdx] && CATEGORIES[cIdx].items && CATEGORIES[cIdx].items.length > 0) 
            ? CATEGORIES[cIdx].items.length 
            : ITEM_COUNT;
        const cur = c.targetRotation !== undefined ? c.targetRotation : (c.currentAngle || 0);
        const randomSlot = Math.floor(Math.random() * itemCount);
        const baseTarget = - randomSlot * ROTATION_STEP;
        let diff = baseTarget - cur;
        diff = ((diff % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
        const extraSpin = (Math.random() > 0.5 ? 1 : -1) * (Math.PI * 2);
        c.targetRotation = cur + diff + extraSpin;
    });
    saveState(); 
};

window.resetRotation = () => { lastInteractionTime = Date.now(); pauseAutoDuration = 5000; cylinders.forEach(c => c.targetRotation = 0); saveState(); };
window.updateItemTitle = (cId, idx, val) => { CATEGORIES[cId].items[idx].title = val; saveState(); };
window.updateItemMemo = (cId, idx, val) => { CATEGORIES[cId].items[idx].desc = val; saveState(); };
window.updateItemLink = (cId, idx, val) => { CATEGORIES[cId].items[idx].link = val; saveState(); };
function updateStorageStatus() { const eb = window.EMBEDDED_DATA !== undefined; document.getElementById('storage-status').innerHTML = eb ? '<span class="text-green-500 font-black">● 데이터 내장됨</span>' : '<span>○ 브라우저 저장소</span>'; }
function showMessage(t) { const b = document.getElementById('message-box'); b.innerText = t; b.style.display = 'block'; setTimeout(() => b.style.display = 'none', 3000); }

function hideLoader() { 
    const loader = document.getElementById('loading-screen');
    if (loader) {
        loader.style.opacity = '0'; 
        loader.style.pointerEvents = 'none';
        setTimeout(() => { loader.style.display = 'none'; }, 800); 
    }
    // 스플래쉬 화면 종료 직후 바로 음악 플레이
    playAudio();
}

function getCurrentSelection() {
    let selectedItems = [];
    if (!cylinders || cylinders.length === 0 || !CATEGORIES) return [];

    for (let c = 0; c < cylinders.length; c++) {
        if (!CATEGORIES[c] || !CATEGORIES[c].items || CATEGORIES[c].items.length === 0) continue;

        let rot = cylinders[c].targetRotation;
        let turns = Math.round(rot / (Math.PI * 2));
        let normalizedRot = rot - (turns * Math.PI * 2);
        let idx = Math.round(-normalizedRot / ROTATION_STEP);
        idx = ((idx % ITEM_COUNT) + ITEM_COUNT) % ITEM_COUNT;
        
        let item = CATEGORIES[c].items[idx];
        if (item) {
            selectedItems.push(item);
        }
    }
    return selectedItems;
}

// --------------------------------------------------------------------------
// 18. BGM 음악 제어 / 전시 모드(Locked Mode) / 이용 안내 / 전체화면 제어
// --------------------------------------------------------------------------
let isMuted = false;
let audioInitialized = false;

function updateAudioUI(playing) {
    const btn = document.getElementById('audio-control-btn');
    const icon = document.getElementById('volume-icon');
    if (playing && !isMuted) {
        if (icon) icon.src = 'sound icon 1.png';
        if (btn) btn.classList.add('playing');
    } else {
        if (icon) icon.src = 'sound icon 2.png';
        if (btn) btn.classList.remove('playing');
    }
}

function playAudio() {
    const audio = document.getElementById('bgm-audio');
    if (!audio) return;
    
    audio.volume = 0.5;
    audio.muted = isMuted;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            audioInitialized = true;
            updateAudioUI(true);
            removeFirstInteractionListeners();
        }).catch((e) => {
            console.log('Audio playback pending user interaction:', e);
            updateAudioUI(false);
        });
    }
}

const audioInteractionEvents = ['pointerdown', 'touchstart', 'mousedown', 'click', 'keydown', 'wheel'];

function handleFirstAudioInteraction() {
    if (!audioInitialized) {
        playAudio();
    }
}

function addFirstInteractionListeners() {
    audioInteractionEvents.forEach(evt => {
        window.addEventListener(evt, handleFirstAudioInteraction, { capture: true, passive: true });
        document.addEventListener(evt, handleFirstAudioInteraction, { capture: true, passive: true });
    });
}

function removeFirstInteractionListeners() {
    audioInteractionEvents.forEach(evt => {
        window.removeEventListener(evt, handleFirstAudioInteraction, { capture: true });
        document.removeEventListener(evt, handleFirstAudioInteraction, { capture: true });
    });
}

function initAudio() {
    const audio = document.getElementById('bgm-audio');
    if (!audio) return;
    
    audio.volume = 0.5;
    // 1. 바로 재생 시도 (브라우저 자동재생 허용 시 즉시 실행)
    playAudio();

    // 2. 브라우저 차단 정책 대비: 사용자 첫 상호작용 시 캡처 페이즈로 즉시 음악 재생
    if (!audioInitialized) {
        addFirstInteractionListeners();
    }
}

window.toggleAudio = function() {
    const audio = document.getElementById('bgm-audio');
    if (!audio) return;

    if (audio.paused || isMuted) {
        isMuted = false;
        audio.muted = false;
        audio.play().then(() => {
            audioInitialized = true;
            updateAudioUI(true);
            removeFirstInteractionListeners();
        }).catch(e => console.log('Audio toggle play failed:', e));
    } else {
        isMuted = true;
        audio.muted = true;
        audio.pause();
        updateAudioUI(false);
    }
};

function initTitleHoverEffects() {
    const titles = document.querySelectorAll('.interactive-hover-title');
    titles.forEach(titleEl => {
        const text = titleEl.innerText;
        const lines = text.split('\n');
        titleEl.innerHTML = lines.map(line => {
            return line.split('').map(char => {
                if (char === ' ') return ' ';
                return `<span class="title-hover-letter">${char}</span>`;
            }).join('');
        }).join('<br>');
    });
}

window.addEventListener('load', () => {
    init();
    initAudio();
    initTitleHoverEffects();
}); 
window.addEventListener('click', () => { document.querySelectorAll('.set-dropdown-menu').forEach(m => m.classList.remove('active')); });
window.closeInstructions = () => { 
    const o = document.getElementById('instruction-overlay'); 
    if (o) { 
        o.style.opacity = '0'; 
        setTimeout(() => o.style.display = 'none', 500); 
    }
    if (!audioInitialized) {
        playAudio();
    }
    pauseAutoDuration = 0;
    isHovering = false;
    isDragging = false;
};
window.showInstructions = () => { const o = document.getElementById('instruction-overlay'); if (o) { o.style.display = 'flex'; setTimeout(() => o.style.opacity = '1', 10); } };

// Shift + L 키 입력 시 전시 모드(Locked Mode) <-> 편집 모드 전환
window.addEventListener('keydown', (e) => { if (e.shiftKey && e.code === 'KeyL') { isLocked = !isLocked; document.body.classList.toggle('mode-locked', isLocked); showMessage(isLocked ? "🔒 전시 모드" : "🔓 편집 모드"); } });

function toggleFullScreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) docEl.requestFullscreen();
        else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
        else if (docEl.mozRequestFullScreen) docEl.mozRequestFullScreen();
        else if (docEl.msRequestFullscreen) docEl.msRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
        else if (document.msExitFullscreen) docEl.msExitFullscreen();
    }
}


