import {AntDesign} from "@expo/vector-icons";
import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {StyleSheet, Text, TextProps, View, ViewStyle} from "react-native";
import {
    LongPressGestureHandler,
    LongPressGestureHandlerGestureEvent,
    PanGestureHandler,
    PanGestureHandlerGestureEvent,
    TapGestureHandler,
    TapGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import Animated, {
    interpolate,
    runOnJS,
    SharedValue,
    useAnimatedGestureHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import {CLAMP_SIDE} from "./main";

const clamp = (value: number, min: number, max: number) => {
    "worklet";
    return Math.min(Math.max(value, min), max);
};
const DEFAULT_BUTTON_WIDTH = 200;
const DEFAULT_BUTTON_HEIGHT = 70;
const DEFAULT_ICON_SIZE = 20;

type IconStyle = {
    size: number;
    color: ViewStyle["backgroundColor"];
};
type Props = {
    /**
     * Min Value of Counter
     */
    min?: number;
    /**
     * Max Value of Counter
     */
    max?: number;
    /**
     * for controlled component
     */
    value?: number;
    /**
     * for controlled component
     */
    onValueChanged?: (value: number) => void;
    /**
     * this is a value between 0 and 1
     * slider handle moves between [-this * width, +this * width]
     */
    slideOffsetRatio?: number;
    /**
     * this is a value between 0 and 1
     * if you release slider handle between [-this * slideOffsetRatio * width, +this * slideOffsetRatio * width] it gets accepted otherwise it bounces back to its origin
     */
    slideAcceptRatio?: number;
    /**
     * this is the iconSize for plus, minus
     */
    iconSize?: number;
    /**
     * Default : false
     */
    vertical?: boolean;
    /**
     * style wrapper
     */
    style?: Omit<ViewStyle, "width" | "height"> & {
        width: number;
        height: number;
    };
    /**
     * style handle
     */
    handleStyle?: ViewStyle;
    /**
     * style label
     */
    labelStyle?: TextProps["style"];
    /**
     * this can be used to limit clamping for clearing the input
     */
    clampSide?: CLAMP_SIDE;
    /**
     * custom minus button
     */
    minusIcon?: Omit<Element, any>;
    /**
     * custom plus button
     */
    plusIcon?: Omit<Element, any>;
    /**
     * custom close button
     */
    closeIcon?: Omit<Element, any>;
    /**
     * This can be used to filter the value on change.
     *
     * @param oldValue
     * @param newValue
     */
    filterValue?: (oldValue: number, newValue: number) => number;
    /**
     * you can define the default icon styles here
     */
    defaultIconsStyle?: {
        plus: IconStyle;
        minus: IconStyle;
        close: IconStyle;
    };
    /**
     *
     */
    iconStyleWrapper?: ViewStyle;
    /**
     * Tap on the handler when it is settled triggers this.
     */
    onHandlerLongTap?: () => void;
};

export default function SlidingCounter({
    min = -Infinity,
    max = Infinity,
    value = 0,
    onValueChanged,
    slideOffsetRatio = 0.3,
    slideAcceptRatio = 0.75,
    vertical = false,
    style,
    clampSide = CLAMP_SIDE.START,
    filterValue = (oldValue, newValue) => newValue,
    plusIcon,
    minusIcon,
    closeIcon,
    defaultIconsStyle = {
        plus: {size: DEFAULT_ICON_SIZE, color: "white"},
        minus: {size: DEFAULT_ICON_SIZE, color: "white"},
        close: {size: DEFAULT_ICON_SIZE, color: "white"},
    },
    handleStyle,
    labelStyle,
    iconStyleWrapper,
    onHandlerLongTap,
}: Props) {
    const panRef = useRef();
    const tapPlusRef = useRef();
    const tapMinusRef = useRef();
    const tapHandlerRef = useRef();

    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const applyLimits = (v: number) => Math.max(min, Math.min(max, v));
    const [count, setCount] = useState(applyLimits(value));

    const {width, height, wrapperWidth, wrapperHeight} = useMemo(() => {
        const result = {
            width:
                style?.width ||
                (vertical ? DEFAULT_BUTTON_HEIGHT : DEFAULT_BUTTON_WIDTH),
            height:
                style?.height ||
                (vertical ? DEFAULT_BUTTON_WIDTH : DEFAULT_BUTTON_HEIGHT),
            wrapperWidth: 0,
            wrapperHeight: 0,
        };
        result.wrapperWidth = vertical ? result.height : result.width;
        result.wrapperHeight = vertical ? result.width : result.height;
        return result;
    }, [vertical, style]);

    const MAX_SLIDE_OFFSET = wrapperWidth * slideOffsetRatio;

    useEffect(() => {
        if (onValueChanged) {
            onValueChanged(count);
        }
    }, [count]);

    useEffect(() => {
        setCount(applyLimits(value));
    }, [value]);

    const incrementCount = useCallback(() => {
        setCount((currentCount) =>
            applyLimits(filterValue(currentCount, currentCount + 1))
        );
    }, []);
    const decrementCount = useCallback(() => {
        setCount((currentCount) =>
            applyLimits(filterValue(currentCount, currentCount - 1))
        );
    }, []);
    const resetCount = useCallback(() => {
        setCount((currentCount) => applyLimits(filterValue(currentCount, 0)));
    }, []);

    const onPanGestureEvent =
        useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
            onActive: (event) => {
                const X = vertical ? translateY : translateX;
                const Y = vertical ? translateX : translateY;
                X.value = clamp(
                    vertical ? event.translationY : event.translationX,
                    (vertical ? max : min) === count ? 0 : -MAX_SLIDE_OFFSET,
                    (vertical ? min : max) === count ? 0 : MAX_SLIDE_OFFSET
                );

                let yClampMin = -MAX_SLIDE_OFFSET;
                if (clampSide === CLAMP_SIDE.START) {
                    yClampMin = 0;
                }
                let yClampMax = MAX_SLIDE_OFFSET;
                if (clampSide === CLAMP_SIDE.END) {
                    yClampMax = 0;
                }

                Y.value = clamp(
                    vertical ? event.translationX : event.translationY,
                    yClampMin,
                    yClampMax
                );
            },
            onEnd: () => {
                const X = vertical ? translateY : translateX;
                const Y = vertical ? translateX : translateY;

                if (X.value >= MAX_SLIDE_OFFSET * slideAcceptRatio) {
                    runOnJS(vertical ? decrementCount : incrementCount)();
                } else if (X.value <= -MAX_SLIDE_OFFSET * slideAcceptRatio) {
                    runOnJS(vertical ? incrementCount : decrementCount)();
                } else if (
                    Math.abs(Y.value) >=
                    MAX_SLIDE_OFFSET * slideAcceptRatio
                ) {
                    runOnJS(resetCount)();
                }
                X.value = withSpring(0, {stiffness: 400});
                Y.value = withSpring(0, {stiffness: 400});
            },
        });

    const handleTapMinusPlus = (plus: boolean) => {
        "worklet";
        (!vertical ? translateX : translateY).value = withTiming(
            (plus ? 1 : -1) * (vertical ? -1 : 1) * MAX_SLIDE_OFFSET,
            {
                duration: 120,
            },
            (finished) => {
                if (finished) {
                    (!vertical ? translateX : translateY).value = withSpring(
                        0,
                        {
                            stiffness: 400,
                        }
                    );
                    runOnJS(plus ? incrementCount : decrementCount)();
                }
            }
        );
    };

    const onHandlerTapGestureEvent =
        useAnimatedGestureHandler<LongPressGestureHandlerGestureEvent>({
            onFinish: (event) => {
                if (event.duration > 1000) {
                    if (translateX.value + translateY.value < 5) {
                        if (onHandlerLongTap) {
                            runOnJS(onHandlerLongTap)();
                        }
                    }
                }
            },
        });

    const onPlusTapGestureEvent =
        useAnimatedGestureHandler<TapGestureHandlerGestureEvent>({
            onFinish: (event) => {
                if (max === count) return;
                handleTapMinusPlus(true);
            },
        });

    const onMinusPlusTapGestureEvent =
        useAnimatedGestureHandler<TapGestureHandlerGestureEvent>({
            onFinish: (event) => {
                if (min === count) return;
                handleTapMinusPlus(false);
            },
        });

    const rStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {translateX: translateX.value},
                {translateY: translateY.value},
            ],
        };
    }, []);

    const plusMinusOpacityHandler = (
        translateX: number,
        translateY: number
    ) => {
        "worklet";
        const opacityX = interpolate(
            !vertical ? translateX : translateY,
            [-MAX_SLIDE_OFFSET, 0, MAX_SLIDE_OFFSET],
            [0.4, 0.8, 0.4]
        );

        const opacityY = interpolate(
            !vertical ? translateY : translateX,
            [-MAX_SLIDE_OFFSET, 0, MAX_SLIDE_OFFSET],
            [0, 1, 0]
        );
        return {
            opacity: opacityX * opacityY,
        };
    };
    const rMinusIconStyle = useAnimatedStyle(() => {
        if (count === min) {
            return {
                opacity: 0,
            };
        }
        return plusMinusOpacityHandler(translateX.value, translateY.value);
    }, [count, min]);
    const rPlusIconStyle = useAnimatedStyle(() => {
        if (count === max) {
            return {
                opacity: 0,
            };
        }
        return plusMinusOpacityHandler(translateX.value, translateY.value);
    }, [count, max]);

    const rCloseIconStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            !vertical ? translateY.value : translateX.value,
            [-MAX_SLIDE_OFFSET, 0, MAX_SLIDE_OFFSET],
            [0.8, 0, 0.8]
        );
        return {
            opacity,
        };
    }, []);
    const rWrapperStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateX: translateX.value * 0.1,
                },
                {
                    translateY: translateY.value * 0.1,
                },
            ],
        };
    });

    return (
        <Animated.View
            style={[
                styles.button,
                {
                    width: width,
                    height: height,
                    ...style,
                    flexDirection: vertical ? "column-reverse" : "row",
                },
                rWrapperStyle,
            ]}
        >
            <View
                style={{
                    ...StyleSheet.absoluteFillObject,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <LongPressGestureHandler
                    simultaneousHandlers={[panRef]}
                    ref={tapHandlerRef}
                    onGestureEvent={onHandlerTapGestureEvent}
                >
                    <Animated.View
                        style={{
                            ...StyleSheet.absoluteFillObject,
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <PanGestureHandler
                            ref={panRef}
                            simultaneousHandlers={[
                                tapPlusRef,
                                tapMinusRef,
                                tapHandlerRef,
                            ]}
                            onGestureEvent={onPanGestureEvent}
                        >
                            <Animated.View
                                style={[rStyle, styles.circle, handleStyle]}
                            >
                                <Text style={[styles.text, labelStyle]}>
                                    {count}
                                </Text>
                            </Animated.View>
                        </PanGestureHandler>
                    </Animated.View>
                </LongPressGestureHandler>
            </View>

            <TapGestureHandler
                simultaneousHandlers={[panRef]}
                ref={tapPlusRef}
                onGestureEvent={onMinusPlusTapGestureEvent}
            >
                <Animated.View
                    style={[
                        styles.plusMinus,
                        iconStyleWrapper,
                        rMinusIconStyle,
                    ]}
                >
                    {minusIcon ? (
                        minusIcon
                    ) : (
                        <AntDesign
                            name="minus"
                            color={defaultIconsStyle.plus.color}
                            size={defaultIconsStyle.plus.size}
                        />
                    )}
                </Animated.View>
            </TapGestureHandler>

            <Animated.View style={rCloseIconStyle} pointerEvents="none">
                {closeIcon ? (
                    closeIcon
                ) : (
                    <AntDesign
                        name="close"
                        color={defaultIconsStyle.close.color}
                        size={defaultIconsStyle.close.size}
                    />
                )}
            </Animated.View>

            <TapGestureHandler
                simultaneousHandlers={[panRef]}
                ref={tapPlusRef}
                onGestureEvent={onPlusTapGestureEvent}
            >
                <Animated.View
                    style={[styles.plusMinus, iconStyleWrapper, rPlusIconStyle]}
                >
                    {plusIcon ? (
                        plusIcon
                    ) : (
                        <AntDesign
                            name="plus"
                            color={defaultIconsStyle.minus.color}
                            size={defaultIconsStyle.minus.size}
                        />
                    )}
                </Animated.View>
            </TapGestureHandler>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    button: {
        justifyContent: "space-evenly",
        alignItems: "center",
        backgroundColor: "#111111",
        borderRadius: 50,
    },
    circle: {
        height: 50,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#4f4f4f",
        width: 50,
        position: "absolute",
        borderRadius: 25,
        backgroundColor: "#232323",
    },
    text: {fontSize: 25, color: "white"},
    plusMinus: {
        width: 40,
        minHeight: 40,
        alignItems: "center",
        justifyContent: "center",
    },
});
