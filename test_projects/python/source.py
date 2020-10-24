KONSTANT = "KONSTANT"


def funktion(value):
    print(value)


class Klass:
    def method(self):
        funktion(KONSTANT)

    def method_with_underscores(self):
        ...


Klass().method()
Klass().method_with_underscores()
ExternalLib()
