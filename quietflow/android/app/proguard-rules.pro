# Capacitor / WebView JS Bridge
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepclassmembers class com.getcapacitor.** { *; }
-keepclassmembers class org.apache.cordova.** { *; }

# Keep WebView client / chrome client
-keepclassmembers class * extends android.webkit.WebViewClient { *; }
-keepclassmembers class * extends android.webkit.WebChromeClient { *; }

# OkHttp / network (if used)
-dontwarn okhttp3.**
-dontwarn okio.**

# Keep Capacitor plugin classes
-keep class com.getcapacitor.** { *; }
-keep class org.apache.cordova.** { *; }

# Prevent R8 from removing unused resources referenced dynamically
-keep class **.R$* { *; }