import SwiftUI

struct ContentView: View {
    var body: some View {
        WebView().edgesIgnoringSafeArea(.all)
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
