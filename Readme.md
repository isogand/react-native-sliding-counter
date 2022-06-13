# React Native Sliding Counter

<!-- ## Introduction -->

<div>
<h3> A demo <h1>
 </br>

![](https://github.com/isogand/react-native-sliding-counter/blob/master/public/image/demo.gif)</div>

This library provides...

* feature 1
* feature 2

## Quick Start

### Installation

```bash
yarn add @isogand/react-native-sliding-counter
```

or 

```bash
npm install @isogand/react-native-sliding-counter
```
 
## Usage

 ```tsx
  import React,  from 'react';
  import { View,StyleSheet, Text } from 'react-native';
  import { GestureHandlerRootView} from 'react-native-gesture-handler';
  import SlidingCounter from '@isogand/react-native-sliding-counter';
  
  
  export default function App() {
      return (
        <GestureHandlerRootView style={{flex:1}}>
          <View style={styles.container}>
            <SlidingCounter / >
          </View>
        </GestureHandlerRootView>
      );
  }
 const styles = StyleSheet.create({
   container: {
        flex: 1,
        backgroundColor: '#656565',
        alignItems: 'center',
        justifyContent: 'center',
  },
});
 ```

